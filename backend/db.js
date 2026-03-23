const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 支持通过 DB_PATH 环境变量指定数据库路径（Docker 挂载持久化卷时使用）
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');

// 确保目录存在（容器首次启动时 /app/data 可能为空）
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);

// 开启 WAL 模式，提升并发读写性能
db.pragma('journal_mode = WAL');

// ─── 建表 ─────────────────────────────────────────────────────────────

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

module.exports = db;
