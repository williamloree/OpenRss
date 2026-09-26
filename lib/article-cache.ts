import { Article } from "@/@types/Article";

// Derniers articles chargés, relus quand le réseau est indisponible (PWA hors ligne)
const STORAGE_KEY = "openrss_cached_articles";

export function saveCachedArticles(articles: Article[]): void {
  try {
    // Le corps HTML complet n'est pas affiché : on l'écarte pour tenir dans le quota
    const light = articles.map((article) => ({
      ...article,
      content: { ...article.content, body: "" },
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(light));
  } catch (error) {
    console.error("Error saving cached articles:", error);
  }
}

export function loadCachedArticles(): Article[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading cached articles:", error);
    return [];
  }
}
