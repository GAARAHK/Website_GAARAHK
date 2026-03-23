const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 上传目录（通过环境变量或默认路径配置）
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 允许的文件类型白名单（防止上传恶意文件）
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 单文件最大 100MB
});

// ─── 认证中间件 ────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET || 'change_this_in_production');
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

// POST /api/upload — 上传单个文件（需 JWT）
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' });
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

// GET /api/upload/list — 获取已上传文件列表（需 JWT）
router.get('/list', requireAuth, (_req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const stat = fs.statSync(path.join(UPLOAD_DIR, f));
        return { filename: f, url: `/uploads/${f}`, size: stat.size, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime) // 最新在前
      .map(({ filename, url, size }) => ({ filename, url, size }));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// 文件上传错误处理中间件
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: '上传失败' });
});

module.exports = router;
