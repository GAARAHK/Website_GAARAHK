# ─── Stage: production ───────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# 先只复制 package 文件，充分利用 Docker 层缓存
COPY package*.json ./

# 安装生产依赖（better-sqlite3 依赖 node-gyp，需要 python3 / make / g++）
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && apk del python3 make g++

# 再复制代码（代码改动时不重新安装依赖）
COPY . .

# SQLite 数据库文件挂载点
VOLUME ["/app/data"]

# 让数据库路径指向挂载的持久化目录
ENV DB_PATH=/app/data/data.sqlite

EXPOSE 3000

CMD ["node", "server.js"]
