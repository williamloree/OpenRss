import { useCallback, useEffect, useState } from "react";
import { RssFeed } from "@/hooks/useRssFeeds";

const MUTED_FEEDS_KEY = "openrss_push_muted_feeds";
const LAST_SYNC_KEY = "openrss_push_last_sync";

export type PushStatus =
  | "loading"
  | "unsupported" // navigateur sans Push API (ou iOS hors app installée)
  | "unavailable" // pas de service worker (ex. en dev)
  | "denied"
  | "disabled"
  | "enabled";

function readMutedFeeds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MUTED_FEEDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function sendSubscription(
  subscription: PushSubscription,
  feeds: RssFeed[],
  mutedFeeds: string[]
): Promise<void> {
  const body = JSON.stringify({
    subscription: subscription.toJSON(),
    feeds: feeds
      .filter((feed) => !mutedFeeds.includes(feed.url))
      .map((feed) => ({ url: feed.url, title: feed.title })),
  });

  // Rien n'a changé depuis la dernière synchro : pas d'appel réseau
  if (localStorage.getItem(LAST_SYNC_KEY) === body) return;

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save subscription");
  }
  localStorage.setItem(LAST_SYNC_KEY, body);
}

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  // Le service worker n'est enregistré qu'en production (ServiceWorkerRegister)
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
    return undefined;
  }
  // Au premier chargement, l'enregistrement peut être encore en cours
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 10_000)),
  ]);
}

/**
 * Notifications push : activation, choix des flux et synchronisation
 * automatique de la liste des flux avec le serveur.
 */
export function usePushNotifications(feeds: RssFeed[]) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [mutedFeeds, setMutedFeeds] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const init = async () => {
      setMutedFeeds(readMutedFeeds());

      if (!("PushManager" in window) || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }
      const registration = await getRegistration();
      if (!registration) {
        setStatus("unavailable");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const existing = await registration.pushManager.getSubscription();
      setSubscription(existing);
      setStatus(existing ? "enabled" : "disabled");
    };
    init().catch((error) => {
      console.error("[push] Init failed:", error);
      setStatus("unavailable");
    });
  }, []);

  // Synchronise les flux suivis quand la liste ou les flux coupés changent
  useEffect(() => {
    if (!subscription) return;
    sendSubscription(subscription, feeds, mutedFeeds).catch((error) =>
      console.error("[push] Sync failed:", error)
    );
  }, [subscription, feeds, mutedFeeds]);

  const enable = useCallback(async () => {
    const registration = await getRegistration();
    if (!registration) throw new Error("Service worker indisponible");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus(permission === "denied" ? "denied" : "disabled");
      throw new Error("Permission refusée");
    }

    const response = await fetch("/api/push/public-key");
    if (!response.ok) throw new Error("Notifications indisponibles sur ce serveur");
    const { publicKey } = await response.json();

    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    localStorage.removeItem(LAST_SYNC_KEY);
    await sendSubscription(newSubscription, feeds, mutedFeeds);
    setSubscription(newSubscription);
    setStatus("enabled");
  }, [feeds, mutedFeeds]);

  const disable = useCallback(async () => {
    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});
      await subscription.unsubscribe();
    }
    localStorage.removeItem(LAST_SYNC_KEY);
    setSubscription(null);
    setStatus("disabled");
  }, [subscription]);

  const toggleFeed = useCallback((url: string) => {
    setMutedFeeds((current) => {
      const next = current.includes(url)
        ? current.filter((muted) => muted !== url)
        : [...current, url];
      localStorage.setItem(MUTED_FEEDS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { status, mutedFeeds, enable, disable, toggleFeed };
}
