import Parser from "rss-parser";
import { Article } from "@/@types/Article";

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
  "media:content"?: any;
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
  const guid = item.guid || item.link || `${feedUrl}-${Date.now()}`;
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
  };
}

/**
 * Parse un flux RSS depuis une URL
 */
export async function parseRssFeed(url: string): Promise<{
  feed: {
    title: string;
    description: string;
    link: string;
  };
  items: Article[];
}> {
  try {
    const feed = await parser.parseURL(url) as ParsedFeed;

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
