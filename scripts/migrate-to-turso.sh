#!/bin/bash

# 迁移本地 SQLite 数据到 Turso
# 使用前请先设置环境变量：
# export TURSO_DATABASE_URL="libsql://xxx.turso.io"
# export TURSO_AUTH_TOKEN="xxx"

if [ -z "$TURSO_DATABASE_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo "请先设置 TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN 环境变量"
    echo "获取方式："
    echo "  turso db show runpaceflow --url"
    echo "  turso db tokens create runpaceflow"
    exit 1
fi

# 检查本地数据库是否存在
if [ ! -f "data/activities.db" ]; then
    echo "错误：找不到本地数据库文件 data/activities.db"
    exit 1
fi

echo "开始迁移数据到 Turso..."

# 导出本地数据
echo "导出本地数据..."
sqlite3 data/activities.db .dump > data/backup.sql

# 使用 turso CLI 导入数据
echo "导入数据到 Turso..."
turso db shell runpaceflow < data/backup.sql

echo "数据迁移完成！"
echo ""
echo "下一步："
echo "1. 在 Vercel Dashboard 中设置环境变量："
echo "   DATABASE_URL=$TURSO_DATABASE_URL"
echo "   DATABASE_AUTH_TOKEN=$TURSO_AUTH_TOKEN"
echo "2. 重新部署应用"