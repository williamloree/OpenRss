import webpush, { WebPushError } from "web-push";
import { getDatabase } from "@/lib/db";
import { parseRssFeed } from "@/lib/rss-parser";
import { assertPublicUrl, UnsafeUrlError } from "@/lib/safe-fetch";
import { Article } from "@/@types/Article";

export const MAX_FEEDS_PER_SUBSCRIPTION = 100;
const MAX_ARTICLES_PER_NOTIFICATION = 3;
const FEED_CHECK_CONCURRENCY = 5;

export interface PushFeed {
  url: string;
  title: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface SubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  feeds: string;
}

// --- Clés VAPID -------------------------------------------------------------
// Variables d'environnement si définies, sinon générées une fois et stockées
// dans SQLite (volume data/) pour rester stables entre les redémarrages.

let vapidPublicKey: string | null = null;

function getConfig(key: string): string | undefined {
  const row = getDatabase()
    .prepare("SELECT value FROM app_config WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

function setConfig(key: string, value: string): void {
  getDatabase()
    .prepare("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)")
    .run(key, value);
}

export function getVapidPublicKey(): string {
  if (vapidPublicKey) return vapidPublicKey;

  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    publicKey = getConfig("vapid_public_key");
    privateKey = getConfig("vapid_private_key");
    if (!publicKey || !privateKey) {
      const keys = webpush.generateVAPIDKeys();
      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
      setConfig("vapid_public_key", publicKey);
      setConfig("vapid_private_key", privateKey);
      console.log("[push] Generated VAPID keys (stored in database)");
    }
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://github.com/williamloree/OpenRss",
    publicKey,
    privateKey
  );
  vapidPublicKey = publicKey;
  return publicKey;
}

// --- Abonnements ------------------------------------------------------------

/**
 * L'endpoint vient du navigateur et le serveur y envoie des requêtes :
 * même protection SSRF que pour les flux (HTTPS + adresse publique).
 */
export async function assertValidEndpoint(endpoint: string): Promise<void> {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new UnsafeUrlError("Invalid push endpoint");
  }
  if (url.protocol !== "https:") {
    throw new UnsafeUrlError("Push endpoint must use HTTPS");
  }
  await assertPublicUrl(url);
}

export function saveSubscription(
  subscription: PushSubscriptionInput,
  feeds: PushFeed[]
): void {
  getDatabase()
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, feeds)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         feeds = excluded.feeds,
         updated_at = CURRENT_TIMESTAMP`
    )
    .run(
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      JSON.stringify(feeds)
    );
}

export function deleteSubscription(endpoint: string): void {
  getDatabase()
    .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .run(endpoint);
}

// --- Détection des nouveaux articles -----------------------------------------

/**
 * Compare les articles actuels d'un flux avec ceux vus au dernier passage.
 * Au premier passage, on mémorise l'état sans rien notifier.
 */
function detectNewArticles(url: string, items: Article[]): Article[] {
  const db = getDatabase();
  const row = db
    .prepare("SELECT guids FROM feed_seen_items WHERE url = ?")
    .get(url) as { guids: string } | undefined;

  db.prepare(
    `INSERT INTO feed_seen_items (url, guids, checked_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(url) DO UPDATE SET guids = excluded.guids, checked_at = CURRENT_TIMESTAMP`
  ).run(url, JSON.stringify(items.map((item) => item.guid)));

  if (!row) return [];
  const seen = new Set<string>(JSON.parse(row.guids));
  return items.filter((item) => !seen.has(item.guid));
}

function buildPayload(feed: PushFeed, articles: Article[]): string {
  const single = articles.length === 1;
  const shown = articles.slice(0, MAX_ARTICLES_PER_NOTIFICATION);
  const more = articles.length - shown.length;

  return JSON.stringify({
    title: single
      ? feed.title
      : `${articles.length} nouveaux articles · ${feed.title}`,
    body:
      shown.map((article) => article.title).join("\n") +
      (more > 0 ? `\n+ ${more} autre${more > 1 ? "s" : ""}` : ""),
    url: single ? articles[0].link : "/",
    tag: feed.url,
  });
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      await fn(queue.shift()!);
    }
  });
  await Promise.all(workers);
}

/**
 * Vérifie tous les flux suivis et envoie une notification par flux
 * contenant de nouveaux articles à chaque abonné concerné.
 */
export async function checkFeedsAndNotify(): Promise<{
  feeds: number;
  sent: number;
  removed: number;
}> {
  getVapidPublicKey();
  const subscriptions = getDatabase()
    .prepare("SELECT id, endpoint, p256dh, auth, feeds FROM push_subscriptions")
    .all() as SubscriptionRow[];

  // Flux distincts -> abonnés qui les suivent
  const subscribersByFeed = new Map<string, { row: SubscriptionRow; feed: PushFeed }[]>();
  for (const row of subscriptions) {
    for (const feed of JSON.parse(row.feeds) as PushFeed[]) {
      const list = subscribersByFeed.get(feed.url) ?? [];
      list.push({ row, feed });
      subscribersByFeed.set(feed.url, list);
    }
  }

  let sent = 0;
  const expired = new Set<string>();

  await mapWithConcurrency([...subscribersByFeed.keys()], FEED_CHECK_CONCURRENCY, async (url) => {
    let items: Article[];
    try {
      items = (await parseRssFeed(url)).items;
    } catch {
      return; // Flux indisponible : on réessaiera au prochain passage
    }

    const newArticles = detectNewArticles(url, items);
    if (newArticles.length === 0) return;

    for (const { row, feed } of subscribersByFeed.get(url)!) {
      if (expired.has(row.endpoint)) continue;
      try {
        await assertValidEndpoint(row.endpoint);
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          buildPayload(feed, newArticles),
          { TTL: 60 * 60 * 12 }
        );
        sent++;
      } catch (error) {
        // 404/410 : l'abonnement n'existe plus côté navigateur
        // Endpoint devenu non autorisé : on le retire aussi
        if (
          error instanceof UnsafeUrlError ||
          (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410))
        ) {
          expired.add(row.endpoint);
        } else {
          console.error("[push] Failed to send notification:", error);
        }
      }
    }
  });

  expired.forEach(deleteSubscription);
  return { feeds: subscribersByFeed.size, sent, removed: expired.size };
}
