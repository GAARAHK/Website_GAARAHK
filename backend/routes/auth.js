const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_production';

// POST /api/auth/login — 管理员登录
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: '密码不能为空' });

  const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
  if (!admin) {
    return res.status(500).json({ error: '管理员账户尚未初始化，请先运行 node seed.js' });
  }

  const isValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isValid) return res.status(401).json({ error: '密码错误' });

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
