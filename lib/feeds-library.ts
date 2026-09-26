import library from "@/lib/feeds-library.json";

// Bibliothèque de flux pré-remplie : éditer lib/feeds-library.json puis rebuilder.
// Le fichier est intégré au build (compatible hébergements sans base de données).

export interface FeedLibraryItem {
  id: number;
  category_id: number;
  category_name: string;
  category_icon: string;
  title: string;
  url: string;
  description: string | null;
  language: string;
}

export function getAllFeedsByCategory(): Record<string, FeedLibraryItem[]> {
  const feedsByCategory: Record<string, FeedLibraryItem[]> = {};
  const seenUrls = new Set<string>();
  let id = 0;

  library.forEach((category, index) => {
    feedsByCategory[category.name] = category.feeds
      .map((feed) => {
        // Doublon = erreur de saisie dans le JSON : on fait échouer le build
        if (seenUrls.has(feed.url)) {
          throw new Error(`Duplicate feed URL in feeds-library.json: ${feed.url}`);
        }
        seenUrls.add(feed.url);
        return {
          id: ++id,
          category_id: index + 1,
          category_name: category.name,
          category_icon: category.icon,
          title: feed.title,
          url: feed.url,
          description: feed.description || null,
          language: feed.language || "fr",
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  });

  // Catégories triées par nom, comme l'ancienne requête SQL
  return Object.fromEntries(
    Object.entries(feedsByCategory).sort(([a], [b]) => a.localeCompare(b, "fr"))
  );
}
