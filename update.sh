#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
#  update.sh — 阿里云服务器一键更新脚本
#  用法：cd /opt/blog && bash update.sh
# ─────────────────────────────────────────────────────────────────────

set -e  # 遇到错误立即退出

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$REPO_DIR/docker-compose.yml"

echo ""
echo "========================================"
echo "  🚀 Blog 更新部署脚本"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ── 1. 拉取最新代码 ──────────────────────────────────────────────────
echo "📥 [1/4] 拉取最新代码..."
cd "$REPO_DIR"
git pull --rebase
echo "✅ 代码已更新"
echo ""

# ── 2. 重新构建镜像 ──────────────────────────────────────────────────
echo "🔨 [2/4] 构建 Docker 镜像（仅重新构建有变化的服务）..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "✅ 镜像构建完成"
echo ""

# 检查 .env 文件是否存在
if [ ! -f "$REPO_DIR/.env" ]; then
  echo "⚠️  未检测到 .env 文件，建议创建并设置 JWT_SECRET："
  echo "   cp $REPO_DIR/.env.example $REPO_DIR/.env"
  echo "   vim $REPO_DIR/.env"
  echo ""
fi

# ── 3. 重启容器 ──────────────────────────────────────────────────────
echo "🔄 [3/4] 重启容器（零停机滚动更新）..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
echo "✅ 容器已重启"
echo ""

# ── 4. 清理旧镜像 ────────────────────────────────────────────────────
echo "🧹 [4/4] 清理悬空镜像，释放磁盘空间..."
docker image prune -f
echo "✅ 清理完成"
echo ""

# ── 输出运行状态 ─────────────────────────────────────────────────────
echo "========================================"
echo "  📊 当前容器状态"
echo "========================================"
docker compose -f "$COMPOSE_FILE" ps
echo ""

# 等待后端健康检查通过
echo "⏳ 等待后端健康检查..."
MAX_WAIT=60
ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' blog-backend 2>/dev/null | grep -q "healthy"; do
  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    echo "⚠️  后端健康检查超时，请手动查看日志："
    echo "   docker logs blog-backend --tail 50"
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  echo "   等待中... (${ELAPSED}s)"
done

echo ""
echo "========================================"
echo "  ✅ 更新完成！"
echo "  🌐 访问：http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-server-ip>')"
echo "========================================"
echo ""
