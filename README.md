# GAARAHK 个人博客 — 完整部署手册

> **技术栈**：React (Vite) + TypeScript 前端 | Node.js + Express 后端 | SQLite 数据库 | Nginx 反向代理 | Docker 容器化部署

---

## 目录

1. [项目结构](#项目结构)
2. [本地开发运行](#本地开发运行)
3. [准备部署到云服务器](#准备部署到云服务器)
4. [配置阿里云服务器环境](#配置阿里云服务器环境)
5. [上传项目到服务器](#上传项目到服务器)
6. [配置环境变量](#配置环境变量)
7. [Docker 启动服务](#docker-启动服务)
8. [初始化管理员密码](#初始化管理员密码)
9. [配置阿里云安全组](#配置阿里云安全组)
10. [绑定域名与 HTTPS](#绑定域名与-https)
11. [日常维护命令](#日常维护命令)
12. [常见问题排查](#常见问题排查)

---

## 项目结构

```
Website_GAARAHK/
├── docker-compose.yml        ← Docker 编排文件（一键启动所有服务）
├── .env.example              ← 环境变量模板（需复制为 .env 修改）
├── .gitignore
├── README.md
│
├── backend/                  ← Node.js + Express + SQLite 后端
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── server.js             ← 入口文件
│   ├── db.js                 ← SQLite 数据库初始化
│   ├── seed.js               ← 初始化管理员密码脚本
│   ├── routes/
│   │   ├── articles.js       ← 文章 CRUD API
│   │   └── auth.js           ← 管理员登录 API
│   └── package.json
│
└── frontend/                 ← React + Vite + TypeScript 前端
    ├── Dockerfile            ← 多阶段构建：Vite 打包 → Nginx 托管
    ├── .dockerignore
    ├── nginx.conf            ← Nginx 配置（静态托管 + /api 反代）
    ├── vite.config.ts        ← 开发环境代理配置
    ├── src/
    │   ├── api/index.ts      ← 所有 API 请求封装
    │   ├── components/       ← 通用组件（Navbar、PostCard）
    │   └── pages/            ← 页面组件
    └── package.json
```

### 容器架构图

```
    外网访问 → 公网IP:80
                  ↓
     ┌────────────────────────┐
     │    frontend 容器       │
     │    Nginx (Alpine)      │
     │  ① 托管 React 静态文件 │
     │  ② /api/* → 反向代理  │
     └───────────┬────────────┘
                 │ Docker 内网（blog-net）
                 ↓
     ┌────────────────────────┐
     │    backend 容器        │
     │    Node.js 22          │
     │    Express API :3000   │
     └───────────┬────────────┘
                 │ Volume 挂载
                 ↓
         ./data/data.sqlite    ← 宿主机持久化（数据不随容器删除而消失）
```

---

## 本地开发运行

本地开发不需要 Docker，直接运行 Node.js 和 Vite 即可。

### 前提条件

确保本地电脑已安装 [Node.js 18+](https://nodejs.org/)，在终端执行以下命令确认：

```bash
node -v   # 应显示 v18.x.x 或更高
npm -v    # 应显示 9.x.x 或更高
```

### 启动后端

```bash
# 进入后端目录
cd backend

# 安装依赖（首次运行时执行）
npm install

# 初始化管理员密码（首次运行时执行，密码可自定义）
node seed.js yourPassword

# 启动后端服务（监听 :3000）
npm start
```

看到如下输出表示启动成功：
```
🚀 Blog API running on http://localhost:3000
```

### 启动前端

**新开一个终端窗口**，执行：

```bash
# 进入前端目录
cd frontend

# 安装依赖（首次运行时执行）
npm install

# 启动开发服务器（监听 :5173，/api/* 自动代理到后端 :3000）
npm run dev
```

看到如下输出后，在浏览器打开 `http://localhost:5173`：
```
  VITE  Local: http://localhost:5173/
```

### 本地访问地址

| 页面 | 地址 |
|------|------|
| 博客首页 | `http://localhost:5173/` |
| 文章详情 | `http://localhost:5173/article/1` |
| 后台管理登录 | `http://localhost:5173/admin` |
| 后台文章管理 | `http://localhost:5173/admin/dashboard` |

---

## 准备部署到云服务器

### 第一步：修改 JWT_SECRET（必须！）

JWT_SECRET 是保护后台管理接口的密钥，**绝对不能使用默认值**。

在项目根目录创建 `.env` 文件：

```bash
# 在项目根目录（Website_GAARAHK/）下执行
copy .env.example .env        # Windows 命令提示符
# 或
Copy-Item .env.example .env   # Windows PowerShell
```

用文本编辑器打开 `.env`，将内容修改为：

```env
JWT_SECRET=这里换成你自己的随机字符串例如Gk9xPqmR2nZvLw7hYdAeJcT4sUoFbI  
```

> **如何生成安全的随机字符串**：在浏览器控制台（F12）中执行：
> ```js
> crypto.getRandomValues(new Uint8Array(32)).reduce((s,b)=>s+b.toString(16).padStart(2,'0'),'')
> ```
> 复制输出的64位十六进制字符串作为 JWT_SECRET。

### 第二步：确认前端配置（无需修改）

[frontend/vite.config.ts](frontend/vite.config.ts) 中的代理配置仅用于本地开发。  
生产环境中，Nginx 容器内的 [frontend/nginx.conf](frontend/nginx.conf) 会直接处理反向代理，两者不冲突。

---

## 配置阿里云服务器环境

### SSH 登录服务器

在 Windows 上打开 **PowerShell** 或 **命令提示符**：

```bash
ssh root@你的服务器公网IP
```

例如：
```bash
ssh root@43.138.xx.xx
```

首次登录会提示：
```
Are you sure you want to continue connecting (yes/no)? 
```
输入 `yes` 回车，然后输入服务器密码。

### 安装 Docker 和 Docker Compose

登录服务器后，**依次执行**以下命令：

```bash
# 1. 更新软件包列表
sudo apt update

# 2. 安装 Docker（官方一键安装脚本）
curl -fsSL https://get.docker.com | sh

# 3. 将当前用户加入 docker 用户组（避免每次都要 sudo）
sudo usermod -aG docker $USER

# 4. 使用户组变更立即生效（不用重新登录）
newgrp docker

# 5. 验证 Docker 安装成功
docker --version
# 应显示：Docker version 27.x.x 或更高

# 6. 验证 Docker Compose 安装成功（Docker Desktop 自带 Compose）
docker compose version
# 应显示：Docker Compose version v2.x.x
```

---

## 上传项目到服务器

有三种方式，推荐方式 A（图形化工具，最直观）或方式 B（命令行，适合熟悉命令行的用户）。

---

### 方式 A：使用 FileZilla（推荐，可视化操作）

**1. 下载并安装 FileZilla Client**  
前往 `https://filezilla-project.org/download.php`，下载免费的 **FileZilla Client**。

**2. 连接服务器**  
打开 FileZilla，在顶部快速连接栏填写：

| 字段 | 填写内容 |
|------|---------|
| 主机 | `sftp://你的服务器公网IP` |
| 用户名 | `root` |
| 密码 | 你的服务器密码 |
| 端口 | `22` |

点击**快速连接**。

**3. 创建服务器目录**  
在右侧（服务器端）面板，进入 `/opt` 目录，右键 → **新建目录** → 命名为 `blog`。

**4. 上传项目文件**  
在左侧（本地）面板，导航到你的项目目录 `D:\Flutter_Study\Website_GAARAHK\`。  
**选中以下文件和文件夹**，拖拽到右侧的 `/opt/blog/` 目录：

```
✅ 需要上传的文件/目录：
  backend/        （整个目录，但 node_modules 和 data.sqlite 会被 .dockerignore 自动排除）
  frontend/       （整个目录，但 node_modules 和 dist 会被 .dockerignore 自动排除）
  docker-compose.yml
  .env.example
  .gitignore

❌ 不需要上传：
  backend/node_modules/   （服务器上 Docker 自动安装）
  frontend/node_modules/  （服务器上 Docker 自动安装）
  backend/data.sqlite     （服务器上会自动创建）
```

> **注意**：FileZilla 默认不显示以 `.` 开头的隐藏文件（如 `.env.example`）。  
> 需要在菜单 **服务器** → **强制显示隐藏文件** 中开启。

**5. 上传完成后**，FileZilla 右侧 `/opt/blog/` 目录应包含：

```
/opt/blog/
├── backend/
├── frontend/
├── docker-compose.yml
└── .env.example
```

---

### 方式 B：使用 SCP 命令行上传（Windows PowerShell）

在 **本地 PowerShell** 中执行（替换 IP 地址）：

```powershell
# 在服务器上创建目标目录
ssh root@你的服务器IP "mkdir -p /opt/blog"

# 上传整个项目（排除 node_modules 和 data.sqlite，需要先压缩）
# 先在本地压缩（在项目根目录执行）
cd D:\Flutter_Study\Website_GAARAHK

# 打包（排除不需要的目录）
tar --exclude="*/node_modules" --exclude="*/dist" --exclude="*.sqlite" -czf blog.tar.gz backend frontend docker-compose.yml .env.example

# 上传压缩包
scp blog.tar.gz root@你的服务器IP:/opt/blog/

# SSH 登录服务器，解压
ssh root@你的服务器IP "cd /opt/blog && tar -xzf blog.tar.gz && rm blog.tar.gz"
```

> **注意**：Windows 系统默认不包含 `tar` 命令，如果报错，可以用 **Git Bash** 执行以上命令，或者改用方式 A 的图形工具。

---

### 方式 C：使用 Git（推荐用于后续持续迭代更新）

**本地**（先把代码推送到 GitHub/Gitee）：

```bash
cd D:\Flutter_Study\Website_GAARAHK

git init
git add .
git commit -m "初始化博客项目"

# 在 GitHub 新建仓库后获取仓库地址（例如）：
git remote add origin https://github.com/你的用户名/blog.git
git push -u origin main
```

**服务器上**（SSH 登录后）：

```bash
cd /opt
git clone https://github.com/你的用户名/blog.git blog
```

> **后续更新代码**时，在服务器执行 `cd /opt/blog && git pull` 即可拉取最新代码，再重新构建。

---

## 配置环境变量

SSH 登录服务器后，进入项目目录，创建并编辑 `.env` 文件：

```bash
cd /opt/blog

# 从模板复制
cp .env.example .env

# 用 nano 编辑器打开（更简单）
nano .env
```

将文件内容修改为：

```env
JWT_SECRET=你在上一步生成的随机字符串
```

在 nano 编辑器中：
- 用方向键移动光标到需要修改的位置
- 直接输入修改
- 按 `Ctrl + O` 保存，按回车确认文件名
- 按 `Ctrl + X` 退出

验证文件内容是否正确：

```bash
cat .env
# 应显示：JWT_SECRET=你的随机字符串
```

---

## Docker 启动服务

在服务器的项目目录中执行：

```bash
cd /opt/blog

# 首次启动（会构建镜像，需要几分钟，取决于网速）
docker compose up -d --build
```

**观察构建过程**（不加 `-d` 参数，可以看到实时输出）：

```bash
docker compose up --build
```

正常完成后会看到类似：
```
[+] Building 85.3s (18/18) FINISHED
[+] Running 2/2
 ✔ Container blog-backend   Started
 ✔ Container blog-frontend  Started
```

**验证容器正在运行**：

```bash
docker compose ps
```

应显示两个容器均为 `running` 状态：
```
NAME             STATUS          PORTS
blog-backend     running         3000/tcp
blog-frontend    running         0.0.0.0:80->80/tcp
```

**验证服务是否正常**：

```bash
# 测试后端健康检测接口（通过内网）
curl http://localhost:3000/api/health
# 应返回：{"status":"ok"}

# 测试通过 Nginx 访问（模拟外网请求）
curl http://localhost/api/health
# 应返回：{"status":"ok"}
```

---

## 初始化管理员密码

容器启动成功后，**必须执行**此步骤才能登录后台：

```bash
# 将 yourSecurePassword 替换为你自己的强密码
docker exec -it blog-backend node seed.js yourSecurePassword
```

成功后会显示：
```
✅ 管理员密码已设置/更新成功！
```

> **后续修改密码**也是执行同样的命令，新密码会覆盖旧密码。

---

## 配置阿里云安全组

Docker 服务已在运行，但还需要在**阿里云控制台**开放端口，外网才能访问。

**操作步骤**：

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 左侧导航选择 **云服务器 ECS**
3. 找到你的服务器实例，点击实例名称进入详情
4. 左侧选择 **安全组** → 点击安全组名称
5. 点击 **入方向** 标签页 → **手动添加** 规则

**添加以下两条规则**：

| 优先级 | 协议类型 | 端口范围 | 授权对象 | 描述 |
|--------|---------|---------|---------|------|
| 1 | TCP | 80/80 | 0.0.0.0/0 | HTTP Web访问 |
| 1 | TCP | 443/443 | 0.0.0.0/0 | HTTPS（后续配置SSL时用）|

> ❌ **不要开放 3000 端口**（Node.js API 端口仅供容器内部访问，无需对外暴露）

规则添加后**立即生效**，无需重启服务器。

**测试访问**：在浏览器地址栏输入 `http://你的服务器公网IP`，应该能看到博客首页。

---

## 绑定域名与 HTTPS

### 绑定域名

如果你有自己的域名，在域名服务商控制台添加一条 **A 记录**：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|-------|
| `@`（或 `www`） | A | 你的服务器公网IP |

等待 DNS 生效（通常 5-10 分钟），即可通过域名访问。

### 配置免费 HTTPS（Let's Encrypt）

HTTP 访问不安全，建议配置 HTTPS。需要先有已绑定的域名并能正常访问。

**修改 Nginx 配置**以支持 Certbot 自动配置 SSL：

```bash
# 在服务器上，临时停止 frontend 容器
docker compose stop frontend

# 安装 Certbot（宿主机上安装，用于申请证书）
sudo apt install -y certbot

# 申请证书（这里使用 standalone 模式，临时占用 80 端口）
sudo certbot certonly --standalone -d 你的域名.com

# 证书会保存在：/etc/letsencrypt/live/你的域名.com/
```

然后修改 [frontend/nginx.conf](frontend/nginx.conf)，在文件末尾追加 HTTPS 配置并调整 HTTP 重定向（此处不展开，根据实际域名配置）。

对于初学者，可先使用 HTTP，待项目稳定后再配置 HTTPS。

---

## 日常维护命令

所有命令均需在服务器的 `/opt/blog/` 目录下执行。

### 查看状态

```bash
# 查看所有容器运行状态
docker compose ps

# 实时查看后端日志（Ctrl+C 退出）
docker compose logs -f backend

# 查看前端（Nginx）日志
docker compose logs -f frontend

# 查看所有容器日志
docker compose logs -f
```

### 更新代码后重新部署

```bash
cd /opt/blog

# 如果使用 Git 管理，先拉取最新代码
git pull

# 重新构建并重启（不影响数据库中的数据）
docker compose up -d --build
```

### 停止/重启服务

```bash
# 停止所有容器（数据不会丢失）
docker compose down

# 重启所有容器
docker compose restart

# 只重启后端
docker compose restart backend
```

### 修改管理员密码

```bash
docker exec -it blog-backend node seed.js 新密码
```

### 备份数据库

SQLite 数据库文件在服务器的 `/opt/blog/data/data.sqlite`，直接下载该文件即可备份：

**方法一（SCP 命令，在本地 PowerShell 执行）**：

```powershell
scp root@你的服务器IP:/opt/blog/data/data.sqlite D:\backup\data.sqlite
```

**方法二（FileZilla 下载）**：  
在服务器端导航到 `/opt/blog/data/`，右键 `data.sqlite` → 下载。

---

## 常见问题排查

### 问题 1：`docker compose up --build` 报错 `Permission denied`

```bash
# 解决：确保当前用户在 docker 组中
sudo usermod -aG docker $USER
newgrp docker
# 重新执行命令
```

### 问题 2：浏览器访问公网 IP 无响应

排查顺序：

```bash
# 1. 确认容器在运行
docker compose ps

# 2. 确认 80 端口正在监听
sudo ss -tlnp | grep :80

# 3. 确认本机访问正常
curl http://localhost

# 4. 确认 ——> 阿里云安全组已开放 80 端口（最常见原因！）
```

### 问题 3：后台登录提示"密码错误"

```bash
# 重新设置管理员密码
docker exec -it blog-backend node seed.js 新密码
```

### 问题 4：构建后端镜像时 `better-sqlite3` 编译失败

`better-sqlite3` 是原生模块，需要编译工具。[backend/Dockerfile](backend/Dockerfile) 中已包含 `python3 make g++`，一般不会报错。如果报错，检查服务器网络是否能访问 npm 镜像源：

```bash
# 在服务器上临时配置 npm 镜像（如果构建时下载依赖慢）
# 修改 backend/Dockerfile，在 npm ci 前加一行：
# RUN npm config set registry https://registry.npmmirror.com
```

### 问题 5：内容更新后页面仍显示旧数据（浏览器缓存）

浏览器缓存了静态资源，强制刷新即可：
- Windows/Linux：`Ctrl + Shift + R`
- macOS：`Cmd + Shift + R`

---

## 后台管理使用说明

1. 访问 `http://你的IP或域名/admin`
2. 输入设置好的管理员密码
3. 登录后进入文章管理界面，可以：
   - 点击 **+ 新建文章** 发布新文章
   - 点击 **编辑** 修改已有文章
   - 点击 **删除** 删除文章
4. 文章内容支持 HTML 格式（后续可集成 Markdown 编辑器）
