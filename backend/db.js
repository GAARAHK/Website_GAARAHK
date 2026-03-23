const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    summary     TEXT    DEFAULT '',
    content     TEXT    NOT NULL DEFAULT '',
    cover_image TEXT    DEFAULT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admin (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT    NOT NULL
  );
`);

// 数据库迁移：为已有数据库添加新字段（字段已存在时会报错，用 try/catch 忽略）
const migrations = [
  "ALTER TABLE articles ADD COLUMN category TEXT DEFAULT ''",
  "ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT '[]'",
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* 字段已存在，跳过 */ }
}

module.exports = db;
