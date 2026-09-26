import Parser from "rss-parser";
import { Article } from "@/@types/Article";
import { safeFetch } from "@/lib/safe-fetch";

const MAX_FEED_SIZE = 5 * 1024 * 1024; // 5 Mo

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["content:encoded", "content:encoded"],
      ["dc:creator", "creator"],
    ],
  },
});

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  author?: string;
  content?: string;
  contentSnippet?: string;
  "content:encoded"?: string;
  guid?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
  };
  itunes?: {
    image?: string;
  };
  "media:content"?: { $?: { url?: string } };
}

interface ParsedFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RssItem[];
}

/**
 * Extrait l'URL de l'image d'un item RSS
 */
function extractImageUrl(item: RssItem): string | undefined {
  // Essayer différentes sources d'images
  if (item.enclosure?.url && item.enclosure?.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  if (item.itunes?.image) {
    return item.itunes.image;
  }

  if (item["media:content"]) {
    const media = item["media:content"];
    if (media.$ && media.$.url) {
      return media.$.url;
    }
  }

  // Essayer d'extraire une image du contenu HTML
  const content = item["content:encoded"] || item.content || "";
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return undefined;
}

/**
 * Raccourcit un texte à une longueur maximale
 */
function shortenText(text: string, maxLength: number = 300): string {
  if (!text) return "";
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.substring(0, maxLength) + "...";
}

/**
 * Convertit un item RSS en Article
 */
function convertRssItemToArticle(
  item: RssItem,
  feedTitle: string,
  feedUrl: string
): Article {
  // Identifiant stable : sert de clé React et à détecter les nouveaux articles
  const guid = item.guid || item.link || `${feedUrl}-${item.title || ""}`;
  const title = item.title || "Untitled";
  const link = item.link || "";
  const author = item.creator || item.author || feedTitle || "Unknown";
  const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : undefined;

  const fullContent = item["content:encoded"] || item.content || item.contentSnippet || "";
  const summary = shortenText(fullContent, 300);

  const imageUrl = extractImageUrl(item);
  const categories = item.categories || [];

  // Générer un slug à partir du titre
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    guid,
    title,
    slug,
    link,
    author,
    pubDate,
    scheduledPublicationTime: null,
    timezone: null,
    published: true,
    language: "fr",
    category: categories[0] || "general",
    enclosure: {
      link: item.enclosure?.url,
      type: item.enclosure?.type,
    },
    tags: categories,
    content: {
      summary,
      body: fullContent,
    },
    attachements: {
      articleImg: imageUrl,
      creatorAvatar: undefined,
    },
    feedName: feedTitle,
  };
}

export interface ParsedRssFeed {
  feed: {
    title: string;
    description: string;
    link: string;
  };
  items: Article[];
}

// Cache mémoire : évite de re-télécharger un flux demandé par plusieurs
// clients (ou par la vérification des notifications) dans la même fenêtre.
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const feedCache = new Map<string, { expiresAt: number; promise: Promise<ParsedRssFeed> }>();

/**
 * Parse un flux RSS depuis une URL (avec cache de 5 minutes)
 */
export function parseRssFeed(url: string): Promise<ParsedRssFeed> {
  const now = Date.now();
  const cached = feedCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = fetchRssFeed(url);
  feedCache.delete(url);
  feedCache.set(url, { expiresAt: now + CACHE_TTL_MS, promise });
  // Les erreurs ne sont pas mises en cache
  promise.catch(() => feedCache.delete(url));

  // Map conserve l'ordre d'insertion : on retire les plus anciennes entrées
  while (feedCache.size > CACHE_MAX_ENTRIES) {
    feedCache.delete(feedCache.keys().next().value!);
  }

  return promise;
}

async function fetchRssFeed(url: string): Promise<ParsedRssFeed> {
  try {
    const response = await safeFetch(url, {
      headers: {
        "User-Agent": "OpenRss (+https://openrss.williamloree.fr)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const xml = await response.text();
    if (xml.length > MAX_FEED_SIZE) {
      throw new Error("Feed too large");
    }
    const feed = await parser.parseString(xml) as ParsedFeed;

    const items = feed.items.map((item) =>
      convertRssItemToArticle(item, feed.title || "", url)
    );

    return {
      feed: {
        title: feed.title || "",
        description: feed.description || "",
        link: feed.link || url,
      },
      items,
    };
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse plusieurs flux RSS simultanément
 */
export async function parseMultipleRssFeeds(urls: string[]): Promise<{
  feeds: Array<{
    url: string;
    title: string;
    description: string;
    link: string;
  }>;
  items: Article[];
}> {
  try {
    const results = await Promise.allSettled(
      urls.map((url) => parseRssFeed(url))
    );

    const feeds: Array<{
      url: string;
      title: string;
      description: string;
      link: string;
    }> = [];
    const items: Article[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        feeds.push({
          url: urls[index],
          ...result.value.feed,
        });
        items.push(...result.value.items);
      } else {
        console.error(`Failed to parse feed ${urls[index]}:`, result.reason);
      }
    });

    // Trier les articles par date de publication (plus récent en premier)
    items.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    return { feeds, items };
  } catch (error) {
    console.error("Error parsing multiple RSS feeds:", error);
    throw new Error(`Failed to parse RSS feeds: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
