# ─── 直接使用本地预构建产物，服务器无需编译（节省内存）────────────────
FROM nginx:1.27-alpine

# 删除默认站点配置
RUN rm /etc/nginx/conf.d/default.conf

# 注入自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/blog.conf

# 直接复制本地已构建的 dist 产物
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
