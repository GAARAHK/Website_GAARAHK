const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/articles — 分页列表（可按分类筛选）
router.get('/', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const category = req.query.category || null;

  const where  = category ? 'WHERE category = ?' : '';
  const params = category ? [category] : [];

  const total = db.prepare(`SELECT COUNT(*) as n FROM articles ${where}`).get(...params).n;
  const rows  = db.prepare(
    `SELECT id, title, summary, cover_image, category, tags, created_at, updated_at
     FROM articles ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ data: rows, total, page, pages: Math.ceil(total / limit), limit });
});

// GET /api/articles/categories — 分类列表
router.get('/categories', (req, res) => {
  const rows = db.prepare(
    `SELECT category, COUNT(*) as count FROM articles
     WHERE category != '' AND category IS NOT NULL
     GROUP BY category ORDER BY count DESC`
  ).all();
  res.json(rows);
});

// GET /api/articles/tags — 标签列表
router.get('/tags', (req, res) => {
  const rows = db.prepare("SELECT tags FROM articles WHERE tags IS NOT NULL AND tags != '[]'").all();
  const map = new Map();
  for (const row of rows) {
    try {
      for (const tag of JSON.parse(row.tags)) {
        if (tag) map.set(tag, (map.get(tag) || 0) + 1);
      }
    } catch {}
  }
  res.json([...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
});

// GET /api/articles/search?q= — 搜索（标题 + 概要）
router.get('/search', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const rows = db.prepare(
    `SELECT id, title, summary, cover_image, category, created_at
     FROM articles WHERE title LIKE ? OR summary LIKE ?
     ORDER BY created_at DESC LIMIT 20`
  ).all(q, q);
  res.json(rows);
});

// GET /api/articles/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '文章不存在' });
  res.json(row);
});

// POST /api/articles
router.post('/', requireAuth, (req, res) => {
  const { title, summary = '', content = '', cover_image = null, category = '', tags = '[]' } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  const result = db.prepare(
    'INSERT INTO articles (title, summary, content, cover_image, category, tags) VALUES (?,?,?,?,?,?)'
  ).run(title, summary, content, cover_image, category, tags);
  res.status(201).json(db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/articles/:id
router.put('/:id', requireAuth, (req, res) => {
  const { title, summary, content, cover_image, category, tags } = req.body;
  const ex = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!ex) return res.status(404).json({ error: '文章不存在' });
  db.prepare(
    `UPDATE articles SET title=?,summary=?,content=?,cover_image=?,category=?,tags=?,
     updated_at=datetime('now','localtime') WHERE id=?`
  ).run(
    title ?? ex.title, summary ?? ex.summary, content ?? ex.content,
    cover_image ?? ex.cover_image, category ?? ex.category, tags ?? ex.tags,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

// DELETE /api/articles/:id
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '文章不存在' });
  res.json({ message: '删除成功' });
});

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  try {
    require('jsonwebtoken').verify(header.slice(7), process.env.JWT_SECRET || 'change_this_in_production');
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

module.exports = router;
