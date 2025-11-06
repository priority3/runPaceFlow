#!/bin/bash

# Strava 快速测试脚本

echo "🏃 RunPaceFlow - Strava 集成测试"
echo "=========================================="
echo ""

# 检查环境变量
echo "📝 步骤 1/4: 检查环境变量..."
if [ ! -f ".env.local" ]; then
  echo "❌ 未找到 .env.local 文件"
  echo "请先创建 .env.local 文件并配置 Strava OAuth2 credentials"
  exit 1
fi

# 检查 Strava 配置
MISSING_VARS=()

if ! grep -q "STRAVA_CLIENT_ID=" .env.local || grep -q "STRAVA_CLIENT_ID=$" .env.local; then
  MISSING_VARS+=("STRAVA_CLIENT_ID")
fi

if ! grep -q "STRAVA_CLIENT_SECRET=" .env.local || grep -q "STRAVA_CLIENT_SECRET=$" .env.local; then
  MISSING_VARS+=("STRAVA_CLIENT_SECRET")
fi

if ! grep -q "STRAVA_REFRESH_TOKEN=" .env.local || grep -q "STRAVA_REFRESH_TOKEN=$" .env.local; then
  MISSING_VARS+=("STRAVA_REFRESH_TOKEN")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "⚠️  警告: 缺少以下环境变量配置："
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "配置步骤："
  echo "1. 访问 https://www.strava.com/settings/api"
  echo "2. 创建新的 API Application"
  echo "3. 获取 Client ID 和 Client Secret"
  echo "4. 使用 OAuth2 流程获取 Refresh Token"
  echo ""
  echo "OAuth2 授权流程："
  echo "1. 访问授权 URL："
  echo "   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all"
  echo ""
  echo "2. 授权后，从重定向 URL 获取 code 参数"
  echo ""
  echo "3. 用 code 换取 refresh_token："
  echo "   curl -X POST https://www.strava.com/oauth/token \\"
  echo "     -d client_id=YOUR_CLIENT_ID \\"
  echo "     -d client_secret=YOUR_CLIENT_SECRET \\"
  echo "     -d code=YOUR_CODE \\"
  echo "     -d grant_type=authorization_code"
  echo ""
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
echo "2. 点击 'Strava 同步' 按钮"
echo "3. 等待同步完成"
echo "4. 查看你的跑步数据！"
echo ""
echo "注意事项："
echo "- Strava API 默认限制：每 15 分钟 100 次请求"
echo "- 首次同步建议设置 limit=50"
echo "- 支持可选的日期范围过滤"
echo ""
echo "=========================================="
echo ""

bun run dev
