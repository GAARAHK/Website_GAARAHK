---
mode: 'agent'
description: '根据最新部署实践和已知问题，更新 README.md 中的部署流程、日常维护命令和常见问题排查章节'
tools: ['read_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'run_in_terminal', 'grep_search']
---

# 更新 README 部署文档

更新 `d:\Flutter_Study\Website_GAARAHK\README.md`，使其准确反映**当前实际部署方式**。

---

## 背景知识（必读，再动手）

本项目采用 **本地预构建 + Git 传输 + 服务器纯容器化运行** 的部署模式。

### 架构现状

| 组件 | 构建位置 | 部署方式 |
|------|---------|---------|
| 前端（React/Vite） | **本地 Windows** | `npm run build` → 生成 `dist/` → 提交 git → 服务器 Docker `COPY dist/` |
| 后端（Node.js） | 服务器 Docker 内 | `npm ci --omit=dev`（只装生产依赖，无编译） |

**为什么前端不在服务器构建？**  
服务器只有 2GB RAM，Vite + Rolldown 编译时内存耗尽卡死，因此改为本地预构建。

### 关键文件现状

- `frontend/Dockerfile`：只有单段 nginx，没有 node/builder stage
  ```dockerfile
  FROM nginx:1.27-alpine
  RUN rm /etc/nginx/conf.d/default.conf
  COPY nginx.conf /etc/nginx/conf.d/blog.conf
  COPY dist /usr/share/nginx/html
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```
- `frontend/.gitignore`：`dist` 行已删除（dist 需要提交到 git）
- `frontend/.dockerignore`：`dist/` 行已删除（dist 需要进入 Docker 构建上下文）
- `update.sh`：一键更新脚本，逻辑为：
  1. `git checkout -- .` + `git clean -fd`（丢弃本地修改，保留 .env/数据库）
  2. `git fetch origin && git reset --hard origin/main`
  3. `docker compose build --no-cache`
  4. `docker compose up -d --remove-orphans`
  5. `docker image prune -f`

---

## 操作步骤

### 第一步：读取当前 README

```
read_file README.md（完整读取，了解现有章节结构）
```

### 第二步：定位需要更新的章节

重点更新以下三处：

#### A. 「上传项目到服务器」章节

**旧内容问题**：说的是 FileZilla/SCP/Git clone，且提示 `frontend/dist` 不需要上传。  
**新内容**：现在 `dist/` 已纳入 git 追踪，首次部署直接 `git clone` 即可，不需要 FileZilla/SCP。删除 FileZilla 和 SCP 两种方式，只保留并改写 Git 方式。  
同时删除「不需要上传」列表里的 `frontend/dist` 条目（dist 现在在 git 里）。

#### B. 「日常维护」→「更新代码后重新部署」

**旧内容**：
```bash
git pull
docker compose up -d --build
```
**新内容**（完整的前端更新流程）：
```bash
# ── 本地 Windows（每次修改前端代码后执行）──────────────────
cd D:\Flutter_Study\Website_GAARAHK\frontend
npm run build                    # 重新生成 dist/

cd D:\Flutter_Study\Website_GAARAHK
git add frontend/dist
git commit -m "build: update dist"
git push

# ── 服务器（SSH 登录后执行）──────────────────────────────
cd /opt/blog
bash update.sh                   # 自动 pull + 重新构建 + 重启容器
```

说明：
- 后端代码修改：直接 commit push → 服务器 `bash update.sh`
- 前端代码修改：必须先本地 `npm run build` 重新生成 dist/，再 commit push → `bash update.sh`

#### C. 「常见问题排查」新增两条

**新增问题 N：Dockerfile 出现 `<<<<<<< Updated upstream` 冲突标记**

```
现象：docker compose build 报错 "unknown instruction: <<<<<<<"
原因：git stash pop 时 Dockerfile 与远程版本冲突，留下了 Git 冲突标记
解决：
  git fetch origin
  git reset --hard origin/main   # 强制对齐远程，丢弃所有本地修改
  docker compose build --no-cache && docker compose up -d
```

**新增问题 N+1：前端构建成功但容器复制的是旧页面（dist not found / context 只有 32B）**

```
现象：build 日志显示 "transferring context: 32B"，随后报 "/dist": not found
原因：frontend/.dockerignore 中有 dist/ 一行，把构建产物排除在上下文之外
解决：从 frontend/.dockerignore 中删除 dist/ 这一行，重新构建
```

### 第三步：执行替换

使用 `multi_replace_string_in_file` 一次性完成所有改动，确保 oldString 精确匹配原文（含空行、缩进）。

### 第四步：验证

```
read_file README.md（抽查改动的段落，确认内容正确、Markdown 格式无误）
```

### 第五步：保存提交

```bash
git add README.md
git commit -m "docs(readme): 更新部署流程为本地预构建模式，新增 update.sh 用法和两条常见问题"
git push
```

---

## 注意事项

- 不要删除 HTTPS / 安全组 / 管理员密码初始化等章节，只更新上述三处
- 保持 README 现有的 Markdown 风格（代码块用 \`\`\`bash、表格用 `|` 对齐）
- 新增的常见问题编号接在现有最后一条之后
