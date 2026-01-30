# RunPaceFlow

个人跑步数据可视化平台，支持 Strava 数据自动同步。

[English](../README.md)

## 功能

- 支持 Strava / Nike Run Club 数据导入
- 地图路线可视化与动画回放
- 分段配速分析与图表展示
- **AI 跑步分析**（Claude AI）
- GitHub Actions 每日自动同步
- 响应式设计，适配桌面与移动端

## 配置

### 环境变量

创建 `.env.local` 文件：

```bash
# 必填 - 地图样式
NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# Strava 配置 (推荐)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

# Nike Run Club 配置 (可选)
NIKE_ACCESS_TOKEN=your_access_token

# Claude AI 配置 (可选 - 用于 AI 跑步分析)
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=  # 可选：自定义 API 地址（用于代理）

# 运动目标配置 (可选 - 自定义周/月目标)
NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL=10000   # 每周里程目标（米），默认 10km
NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL=50000  # 每月里程目标（米），默认 50km
NEXT_PUBLIC_WEEKLY_DURATION_GOAL=3600    # 每周时长目标（秒），默认 1 小时
NEXT_PUBLIC_MONTHLY_DURATION_GOAL=18000  # 每月时长目标（秒），默认 5 小时
```

### 获取 Strava Token

1. 前往 [Strava API Settings](https://www.strava.com/settings/api) 创建应用
2. 获取 `Client ID` 和 `Client Secret`
3. 通过 OAuth 流程获取 `Refresh Token`（可参考 [strava-oauth](https://github.com/yihong0618/running_page?tab=readme-ov-file#strava)）

### Claude AI 配置（可选）

AI 功能可为每次跑步生成个性化分析，包括配速分析、分段表现和训练建议。

1. 前往 [Anthropic Console](https://console.anthropic.com/) 获取 API Key
2. 将 `ANTHROPIC_API_KEY` 添加到环境变量
3. （可选）设置 `ANTHROPIC_BASE_URL` 用于代理或其他兼容接口

> 注意：未配置 Claude AI 时，应用正常运行，但不会显示 AI 分析。

## 本地开发

```bash
# 安装依赖
bun install

# 初始化数据库
bun run db:push

# 启动开发服务器
bun run dev

# 手动同步数据
bun run sync
```

访问 http://localhost:3000

## 部署

### 方式一：Vercel（推荐）

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 配置环境变量（同上述 `.env.local`）
4. 部署

> 注意：Vercel 部署需配合 GitHub Actions 进行数据同步，数据库文件存储在仓库中。

### 方式二：Docker (WIP)

```bash
# 使用 docker-compose
docker compose up -d

# 或手动构建
docker build -t runpaceflow .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json \
  -e STRAVA_CLIENT_ID=your_id \
  -e STRAVA_CLIENT_SECRET=your_secret \
  -e STRAVA_REFRESH_TOKEN=your_token \
  -v runpaceflow_data:/app/data \
  runpaceflow
```

## GitHub Actions 自动同步

项目内置 GitHub Actions 工作流，每日自动同步运动数据。

### 配置 Secrets

在仓库 `Settings → Secrets and variables → Actions` 中添加：

| Secret                 | 说明                                |
| ---------------------- | ----------------------------------- |
| `STRAVA_CLIENT_ID`     | Strava 客户端 ID                    |
| `STRAVA_CLIENT_SECRET` | Strava 客户端密钥                   |
| `STRAVA_REFRESH_TOKEN` | Strava Refresh Token                |
| `PAT`                  | Personal Access Token，用于推送更新 |

### 同步机制

- **定时同步**: 每日 UTC 0:00（北京时间 8:00）
  自定义：修改 `.github/workflows/sync.yml` 中的 cron 表达式：
  ```yaml
  on:
    schedule:
      - cron: '0 0 * * *' # UTC 时间，格式：分 时 日 月 周
  ```
- **手动触发**: Actions 页面 → Sync Activities → Run workflow
- **数据存储**: SQLite 数据库自动提交到 `data/activities.db`

## Credits

灵感来源：[yihong0618/running_page](https://github.com/yihong0618/running_page)

## License

MIT
