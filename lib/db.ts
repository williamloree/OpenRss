import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Base utilisée par les notifications push (abonnements, clés VAPID).
// Nom historique conservé pour réutiliser les volumes Docker existants.
const dbPath = path.join(process.cwd(), 'data', 'feeds-library.db');

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
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
}
