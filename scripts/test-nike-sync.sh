#!/bin/bash

# Nike Run Club 快速测试脚本

echo "🏃 RunPaceFlow - Nike Run Club 集成测试"
echo "=========================================="
echo ""

# 检查环境变量
echo "📝 步骤 1/4: 检查环境变量..."
if [ ! -f ".env.local" ]; then
  echo "❌ 未找到 .env.local 文件"
  echo "请先创建 .env.local 文件并配置 NIKE_REFRESH_TOKEN"
  exit 1
fi

if grep -q "your_nike_refresh_token_here" .env.local; then
  echo "⚠️  警告: 检测到默认的 token 占位符"
  echo "请先获取你的 Nike refresh token 并更新 .env.local"
  echo ""
  echo "获取方法："
  echo "1. 访问 https://www.nike.com 并登录"
  echo "2. 打开开发者工具 (F12)"
  echo "3. Application -> Storage -> https://unite.nike.com"
  echo "4. 复制 refresh_token 的值"
  exit 1
fi

echo "✅ 环境变量配置检查完成"
echo ""

# 检查数据库
echo "🗄️  步骤 2/4: 检查数据库..."
if [ ! -f "local.db" ]; then
  echo "📦 数据库不存在，正在创建..."
  bun run db:push
else
  echo "✅ 数据库已存在"
fi
echo ""

# 运行类型检查
echo "🔍 步骤 3/4: TypeScript 类型检查..."
bun run type-check
if [ $? -ne 0 ]; then
  echo "❌ 类型检查失败"
  exit 1
fi
echo "✅ 类型检查通过"
echo ""

# 启动开发服务器
echo "🚀 步骤 4/4: 启动开发服务器..."
echo ""
echo "=========================================="
echo "✨ 一切准备就绪！"
echo ""
echo "下一步："
echo "1. 浏览器打开: http://localhost:3000"
echo "2. 点击 '同步 Nike 数据' 按钮"
echo "3. 等待同步完成"
echo "4. 查看你的跑步数据！"
echo ""
echo "=========================================="
echo ""

bun run dev
