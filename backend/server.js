const express = require('express');
const cors = require('cors');
const path = require('path');

const articlesRouter = require('./routes/articles');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── 中间件 ───────────────────────────────────────────────────────────
// 开发阶段允许本地前端 (localhost:5173) 跨域访问；生产环境下由 Nginx 同源代理，无需 CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : 'http://localhost:5173',
}));

app.use(express.json());

// ─── 路由 ─────────────────────────────────────────────────────────────
app.use('/api/articles', articlesRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// 上传文件静态资源（开发环境直接访问，生产由 Nginx 反代）
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// 健康检测接口
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── 启动 ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Blog API running on http://localhost:${PORT}`);
});
