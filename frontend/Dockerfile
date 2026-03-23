# ─── Stage 1: 构建 React 产物 ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --prefer-offline

COPY . .
RUN npm run build
# 产物位于 /app/dist

# ─── Stage 2: 用 Nginx 托管静态文件 + 反代后端 API ────────────────────
FROM nginx:1.27-alpine

# 删除默认站点配置
RUN rm /etc/nginx/conf.d/default.conf

# 注入自定义 Nginx 配置（在同目录下的 nginx.conf）
COPY nginx.conf /etc/nginx/conf.d/blog.conf

# 复制 React 构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
