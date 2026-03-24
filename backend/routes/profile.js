const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET || 'change_this_in_production');
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// GET /api/profile — 公开接口，博客前台展示博主信息
router.get('/', (_req, res) => {
  const row = db.prepare('SELECT nickname, bio, avatar FROM admin WHERE id = 1').get();
  res.json(row || { nickname: '', bio: '', avatar: '' });
});

// PUT /api/profile — 仅管理员可更新
router.put('/', requireAuth, (req, res) => {
  const { nickname = '', bio = '', avatar = '' } = req.body;
  db.prepare('UPDATE admin SET nickname=?, bio=?, avatar=? WHERE id=1').run(nickname, bio, avatar);
  res.json({ nickname, bio, avatar });
});

module.exports = router;
