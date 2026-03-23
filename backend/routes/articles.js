const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/articles — 获取所有文章（不含正文，仅列表字段）
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, title, summary, cover_image, created_at, updated_at FROM articles ORDER BY created_at DESC'
    )
    .all();
  res.json(rows);
});

// GET /api/articles/:id — 获取单篇文章详情
router.get('/:id', (req, res) => {
  const row = db
    .prepare('SELECT * FROM articles WHERE id = ?')
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: '文章不存在' });
  res.json(row);
});

// POST /api/articles — 新建文章（需 JWT）
router.post('/', requireAuth, (req, res) => {
  const { title, summary = '', content = '', cover_image = null } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });

  const result = db
    .prepare(
      'INSERT INTO articles (title, summary, content, cover_image) VALUES (?, ?, ?, ?)'
    )
    .run(title, summary, content, cover_image);

  const created = db
    .prepare('SELECT * FROM articles WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/articles/:id — 更新文章（需 JWT）
router.put('/:id', requireAuth, (req, res) => {
  const { title, summary, content, cover_image } = req.body;
  const existing = db
    .prepare('SELECT * FROM articles WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: '文章不存在' });

  db.prepare(
    `UPDATE articles
     SET title = ?, summary = ?, content = ?, cover_image = ?,
         updated_at = datetime('now','localtime')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    summary ?? existing.summary,
    content ?? existing.content,
    cover_image ?? existing.cover_image,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

// DELETE /api/articles/:id — 删除文章（需 JWT）
router.delete('/:id', requireAuth, (req, res) => {
  const result = db
    .prepare('DELETE FROM articles WHERE id = ?')
    .run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '文章不存在' });
  res.json({ message: '删除成功' });
});

// ─── 认证中间件 ───────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = header.slice(7);
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET || 'change_this_in_production');
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

module.exports = router;
