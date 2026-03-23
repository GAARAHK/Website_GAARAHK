---
mode: 'agent'
description: '在本地同时启动前端（Vite）和后端（Node.js）服务，并在浏览器中打开预览'
tools: ['run_in_terminal', 'get_terminal_output', 'open_browser_page']
---

# 本地运行前后端服务预览页面

在本地启动 `d:\Flutter_Study\Website_GAARAHK` 项目的前后端服务，并打开浏览器预览。

## 操作步骤

### 1. 启动后端（Node.js, 端口 3000）

在新 PowerShell 窗口中后台运行后端：

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd d:\Flutter_Study\Website_GAARAHK\backend; node server.js'
```

等待约 2 秒，然后验证后端是否启动成功（输出应包含 `Blog API running`）。

### 2. 启动前端（Vite dev server, 端口 5173）

在新 PowerShell 窗口中启动前端：

```powershell
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd d:\Flutter_Study\Website_GAARAHK\frontend; npm run dev'
```

等待约 3 秒让 Vite 完成编译。

### 3. 打开浏览器

访问 **http://localhost:5173**（如端口被占用则尝试 5174、5175）。

## 注意事项

- 后端依赖 SQLite 数据库文件 `backend/data.sqlite`，确保该文件存在
- Vite 已配置 `/api/*` → `localhost:3000` 的反向代理，无需手动设置跨域
- 管理后台入口：http://localhost:5173/admin
- 如需重置端口，先检查占用：`netstat -ano | findstr :3000` 

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| 后端启动失败 | 检查 `backend/node_modules` 是否存在，否则先运行 `npm install` |
| 端口 3000 已占用 | `Stop-Process -Id <PID>` 或修改 `backend/server.js` 中的 PORT |
| 前端编译报错 | 先运行 `npx tsc --noEmit` 查看 TS 错误，再运行 `npm run dev` |
| 白屏 | 打开浏览器控制台（F12）查看 Console 和 Network 面板的错误 |
