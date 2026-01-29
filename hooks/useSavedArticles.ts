import { useSyncExternalStore } from "react";
import { Article } from "@/@types/Article";

export interface SavedArticle {
  guid: string;
  title: string;
  link: string;
  author: string;
  pubDate?: string;
  feedName?: string;
  content: {
    summary: string;
    body: string;
  };
  siteName?: string;
  heroImage?: string;
  imageUrl?: string;
  savedAt: string;
  styledHtml?: string; // Complete HTML with inlined CSS for iframe display
}

const STORAGE_KEY = "openrss_saved_articles";

let listeners: Array<() => void> = [];
let cachedArticles: SavedArticle[] | null = null;

const emptyArticles: SavedArticle[] = [];

function getSnapshot(): SavedArticle[] {
  if (cachedArticles === null) {
    cachedArticles = loadArticles();
  }
  return cachedArticles;
}

function getServerSnapshot(): SavedArticle[] {
  return emptyArticles;
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  cachedArticles = null;
  for (const listener of listeners) {
    listener();
  }
}

function loadArticles(): SavedArticle[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading saved articles from localStorage:", error);
    return [];
  }
}

function saveArticlesToStorage(articles: SavedArticle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    cachedArticles = articles;
    emitChange();
  } catch (error) {
    console.error("Error saving articles to localStorage:", error);
  }
}

interface ExtractedArticle {
  content: string;
  title: string;
  excerpt: string;
  siteName: string;
  heroImage: string | null;
  styledHtml: string;
}

async function fetchArticleContent(url: string): Promise<ExtractedArticle> {
  try {
    const response = await fetch("/api/article/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch article content");
    }

    const data = await response.json();
    return {
      content: data.content || "",
      title: data.title || "",
      excerpt: data.excerpt || "",
      siteName: data.siteName || "",
      heroImage: data.heroImage || null,
      styledHtml: data.styledHtml || "",
    };
  } catch (error) {
    console.error("Error fetching article content:", error);
    return { content: "", title: "", excerpt: "", siteName: "", heroImage: null, styledHtml: "" };
  }
}

export function getStorageSize(): { used: string; percentage: number } {
  if (typeof window === "undefined") {
    return { used: "0 KB", percentage: 0 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || "";
    const bytes = new Blob([stored]).size;
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const maxMb = 5; // localStorage limit is ~5MB

    return {
      used: mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(0)} KB`,
      percentage: Math.min((mb / maxMb) * 100, 100),
    };
  } catch {
    return { used: "0 KB", percentage: 0 };
  }
}

export function useSavedArticles() {
  const articles = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveArticle = async (article: Article): Promise<boolean> => {
    const currentArticles = getSnapshot();

    // Check if already saved
    if (currentArticles.some((a) => a.guid === article.guid)) {
      return false;
    }

    // Fetch the real article content from the URL
    const extracted = await fetchArticleContent(article.link);

    const savedArticle: SavedArticle = {
      guid: article.guid,
      title: extracted.title || article.title,
      link: article.link,
      author: article.author,
      pubDate: article.pubDate,
      feedName: article.feedName,
      content: {
        summary: extracted.excerpt || article.content.summary,
        body: extracted.content || article.content.body,
      },
      siteName: extracted.siteName,
      heroImage: extracted.heroImage || undefined,
      imageUrl: article.attachements?.articleImg || article.enclosure?.link,
      savedAt: new Date().toISOString(),
      styledHtml: extracted.styledHtml || undefined,
    };

    const updatedArticles = [savedArticle, ...currentArticles];
    saveArticlesToStorage(updatedArticles);
    return true;
  };

  const removeArticle = (guid: string): void => {
    const currentArticles = getSnapshot();
    const updatedArticles = currentArticles.filter((a) => a.guid !== guid);
    saveArticlesToStorage(updatedArticles);
  };

  const isArticleSaved = (guid: string): boolean => {
    return articles.some((a) => a.guid === guid);
  };

  const clearAllSaved = (): void => {
    saveArticlesToStorage([]);
  };

  return {
    articles,
    saveArticle,
    removeArticle,
    isArticleSaved,
    clearAllSaved,
    getStorageSize,
  };
}
