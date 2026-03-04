import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'pothole.db');

import fs from 'fs';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL DEFAULT '',
    severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    reporter_name TEXT NOT NULL DEFAULT 'Anonymous',
    photos TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','fixed','disputed')),
    confirmations INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS confirmations (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    confirmed_by TEXT NOT NULL DEFAULT 'Anonymous',
    still_there INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_comments_report ON comments(report_id);
  CREATE INDEX IF NOT EXISTS idx_confirmations_report ON confirmations(report_id);
  CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
`);

export default db;
