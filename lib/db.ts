import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'feeds-library.db');

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create categories table
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create feeds_library table
  database.exec(`
    CREATE TABLE IF NOT EXISTS feeds_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT,
      language TEXT DEFAULT 'fr',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Notifications push : abonnements (flux suivis en JSON) et articles déjà vus par flux
  database.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      feeds TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS feed_seen_items (
      url TEXT PRIMARY KEY,
      guids TEXT NOT NULL,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Initialize with default categories and feeds
  const categoriesCount = database.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (categoriesCount.count === 0) {
    seedDatabase(database);
  } else {
    // Run migrations for existing databases
    runMigrations(database);
  }
}

function runMigrations(database: Database.Database) {
  // Add "Bons Plans" category if it doesn't exist
  const bonsPlansCat = database.prepare('SELECT id FROM categories WHERE name = ?').get('Bons Plans') as { id: number } | undefined;

  let bonsPlansCategoryId: number;

  if (!bonsPlansCat) {
    const result = database.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)').run('Bons Plans', '🎁');
    bonsPlansCategoryId = Number(result.lastInsertRowid);
  } else {
    bonsPlansCategoryId = bonsPlansCat.id;
  }

  // Add new feeds if they don't exist
  const newFeeds = [
    { categoryId: bonsPlansCategoryId, title: 'Dealabs', url: 'https://www.dealabs.com/magazine/rss/news', description: 'Bons plans et promotions', language: 'fr' },
    { categoryId: bonsPlansCategoryId, title: 'Loot Scraper', url: 'https://feed.eikowagenknecht.com/lootscraper.xml', description: 'Jeux gratuits et Epic Games', language: 'en' },
  ];

  const insertFeed = database.prepare('INSERT OR IGNORE INTO feeds_library (category_id, title, url, description, language) VALUES (?, ?, ?, ?, ?)');

  newFeeds.forEach(feed => {
    insertFeed.run(feed.categoryId, feed.title, feed.url, feed.description, feed.language);
  });

  // Remplacer les flux morts (403 / 410 / format non supporté)
  const replacedFeeds = [
    { oldUrl: 'https://www.lesechos.fr/rss.xml', title: 'La Tribune', url: 'https://www.latribune.fr/feed.xml', description: 'Actualités économiques', language: 'fr' },
    { oldUrl: 'http://feeds.hbr.org/harvardbusiness', title: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', description: 'Économie et société', language: 'fr' },
    { oldUrl: 'https://tympanus.net/codrops/feed/', title: 'Creative Bloq', url: 'https://www.creativebloq.com/feeds/all', description: 'Design graphique et web', language: 'en' },
    { oldUrl: 'https://openai.com/blog/rss/', title: 'OpenAI News', url: 'https://openai.com/news/rss.xml', description: 'Actualités OpenAI', language: 'en' },
  ];

  const replaceFeed = database.prepare('UPDATE OR IGNORE feeds_library SET title = ?, url = ?, description = ?, language = ? WHERE url = ?');
  const deleteFeed = database.prepare('DELETE FROM feeds_library WHERE url = ?');

  replacedFeeds.forEach(feed => {
    replaceFeed.run(feed.title, feed.url, feed.description, feed.language, feed.oldUrl);
    // Si le nouveau flux existait déjà, l'UPDATE est ignoré : on retire l'ancien
    deleteFeed.run(feed.oldUrl);
  });
}

function seedDatabase(database: Database.Database) {
  const insertCategory = database.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
  const insertFeed = database.prepare('INSERT INTO feeds_library (category_id, title, url, description, language) VALUES (?, ?, ?, ?, ?)');


  // Categories
  const categories = [
    { name: 'Technologie', icon: '💻' },
    { name: 'Actualités', icon: '📰' },
    { name: 'Science', icon: '🔬' },
    { name: 'Business', icon: '💼' },
    { name: 'Design', icon: '🎨' },
    { name: 'Développement', icon: '⚙️' },
    { name: 'Crypto', icon: '₿' },
    { name: 'IA', icon: '🤖' },
    { name: 'Bons Plans', icon: '🎁' }
  ];

  const categoryIds: Record<string, number> = {};

  categories.forEach(cat => {
    const result = insertCategory.run(cat.name, cat.icon);
    categoryIds[cat.name] = Number(result.lastInsertRowid);
  });

  // Tech Feeds
  const feeds = [
    // Technologie
    { category: 'Technologie', title: 'TechCrunch', url: 'https://techcrunch.com/feed/', description: 'Actualités technologiques et startups', language: 'en' },
    { category: 'Technologie', title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', description: 'Tech, science, art et culture', language: 'en' },
    { category: 'Technologie', title: 'Numerama', url: 'https://www.numerama.com/feed/', description: 'Actualités tech françaises', language: 'fr' },
    { category: 'Technologie', title: 'Frandroid', url: 'https://www.frandroid.com/feed', description: 'Actualités Android et tech', language: 'fr' },

    // Actualités
    { category: 'Actualités', title: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', description: 'Actualités françaises', language: 'fr' },
    { category: 'Actualités', title: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', description: 'Actualités internationales', language: 'en' },
    { category: 'Actualités', title: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', description: 'Info en continu', language: 'fr' },

    // Science
    { category: 'Science', title: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.xml', description: 'Actualités scientifiques', language: 'en' },
    { category: 'Science', title: 'Pour La Science', url: 'https://www.pourlascience.fr/rss.xml', description: 'Vulgarisation scientifique', language: 'fr' },
    { category: 'Science', title: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', description: 'Sciences et technologies', language: 'fr' },

    // Business
    { category: 'Business', title: 'La Tribune', url: 'https://www.latribune.fr/feed.xml', description: 'Actualités économiques', language: 'fr' },
    { category: 'Business', title: 'Alternatives Économiques', url: 'https://www.alternatives-economiques.fr/rss.xml', description: 'Économie et société', language: 'fr' },

    // Design
    { category: 'Design', title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', description: 'Web design et développement', language: 'en' },
    { category: 'Design', title: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', description: 'CSS et front-end', language: 'en' },
    { category: 'Design', title: 'Creative Bloq', url: 'https://www.creativebloq.com/feeds/all', description: 'Design graphique et web', language: 'en' },

    // Développement
    { category: 'Développement', title: 'Dev.to', url: 'https://dev.to/feed', description: 'Communauté de développeurs', language: 'en' },
    { category: 'Développement', title: 'Hacker News', url: 'https://hnrss.org/frontpage', description: 'Tech news pour développeurs', language: 'en' },
    { category: 'Développement', title: 'JavaScript Weekly', url: 'https://javascriptweekly.com/rss/', description: 'Actualités JavaScript', language: 'en' },
    { category: 'Développement', title: 'FreeCodeCamp', url: 'https://www.freecodecamp.org/news/rss/', description: 'Tutoriels et articles de code', language: 'en' },

    // Crypto
    { category: 'Crypto', title: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', description: 'Actualités crypto et blockchain', language: 'en' },
    { category: 'Crypto', title: 'Cointelegraph', url: 'https://cointelegraph.com/rss', description: 'News blockchain', language: 'en' },
    { category: 'Crypto', title: 'Journal du Coin', url: 'https://journalducoin.com/feed/', description: 'Actualités crypto françaises', language: 'fr' },

    // IA
    { category: 'IA', title: 'OpenAI News', url: 'https://openai.com/news/rss.xml', description: 'Actualités OpenAI', language: 'en' },
    { category: 'IA', title: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', description: 'ML et NLP', language: 'en' },
    { category: 'IA', title: 'Google AI Blog', url: 'https://blog.research.google/atom.xml', description: 'Recherche en IA', language: 'en' },

    // Bons Plans
    { category: 'Bons Plans', title: 'Dealabs', url: 'https://www.dealabs.com/magazine/rss/news', description: 'Bons plans et promotions', language: 'fr' },
    { category: 'Bons Plans', title: 'Loot Scraper', url: 'https://feed.eikowagenknecht.com/lootscraper.xml', description: 'Jeux gratuits et Epic Games', language: 'en' },
  ];

  feeds.forEach(feed => {
    insertFeed.run(
      categoryIds[feed.category],
      feed.title,
      feed.url,
      feed.description,
      feed.language
    );
  });
}

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
  const db = getDatabase();

  const feeds = db.prepare(`
    SELECT
      f.id,
      f.category_id,
      c.name as category_name,
      c.icon as category_icon,
      f.title,
      f.url,
      f.description,
      f.language
    FROM feeds_library f
    JOIN categories c ON f.category_id = c.id
    ORDER BY c.name, f.title
  `).all() as FeedLibraryItem[];

  const feedsByCategory: Record<string, FeedLibraryItem[]> = {};

  feeds.forEach(feed => {
    if (!feedsByCategory[feed.category_name]) {
      feedsByCategory[feed.category_name] = [];
    }
    feedsByCategory[feed.category_name].push(feed);
  });

  return feedsByCategory;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.prepare('SELECT id, name, icon FROM categories ORDER BY name').all() as Category[];
}

export function addFeedToLibrary(categoryId: number, title: string, url: string, description: string | null, language: string): number {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO feeds_library (category_id, title, url, description, language) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(categoryId, title, url, description, language);
  return Number(result.lastInsertRowid);
}

export function updateFeedInLibrary(id: number, categoryId: number, title: string, url: string, description: string | null, language: string): void {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE feeds_library SET category_id = ?, title = ?, url = ?, description = ?, language = ? WHERE id = ?');
  stmt.run(categoryId, title, url, description, language, id);
}

export function deleteFeedFromLibrary(id: number): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM feeds_library WHERE id = ?');
  stmt.run(id);
}

export function getFeedById(id: number): FeedLibraryItem | null {
  const db = getDatabase();
  const feed = db.prepare(`
    SELECT
      f.id,
      f.category_id,
      c.name as category_name,
      c.icon as category_icon,
      f.title,
      f.url,
      f.description,
      f.language
    FROM feeds_library f
    JOIN categories c ON f.category_id = c.id
    WHERE f.id = ?
  `).get(id) as FeedLibraryItem | undefined;

  return feed || null;
}
