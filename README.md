# RunPaceFlow (WIP)

running 数据记录，现代化UI

## 功能亮点

| 功能              | 描述                                      |
| ----------------- | ----------------------------------------- |
| 🔄 **多平台同步** | 支持 Strava / Nike Run Club 数据自动导入  |
| ⏰ **定时同步**   | GitHub Actions 每日自动同步，无需手动操作 |
| 🗺️ **地图可视化** | 基于 MapLibre 的高性能路线展示            |
| 📊 **配速分析**   | 详细的分段配速图表与趋势分析              |
| 🎬 **路线回放**   | 动画回放跑步轨迹                          |
| 📱 **响应式设计** | 完美适配桌面与移动端                      |

## 技术栈

```
前端框架    Next.js 15 + React 19 + TypeScript
样式方案    Tailwind CSS 4 + shadcn/ui + Framer Motion
状态管理    Jotai + TanStack Query
数据层      Drizzle ORM + SQLite (Git 持久化)
API 层      tRPC + Zod
地图引擎    MapLibre GL + react-map-gl + Turf.js
```

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

创建 `.env.local`：

```bash
# 地图样式 (MapLibre 开源样式，无需 token)
NEXT_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json

# Strava 配置 (推荐)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

# 或 Nike Run Club 配置
NIKE_REFRESH_TOKEN=your_refresh_token
```

### 3. 初始化数据库

```bash
bun run db:push
```

### 4. 启动开发服务器

```bash
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## GitHub Actions 自动同步

支持通过 GitHub Actions 自动同步运动数据，数据库文件自动提交到仓库。

### 配置 Secrets

在仓库 `Settings → Secrets and variables → Actions` 中添加：

| Secret                 | 说明                 |
| ---------------------- | -------------------- |
| `STRAVA_CLIENT_ID`     | Strava 客户端 ID     |
| `STRAVA_CLIENT_SECRET` | Strava 客户端密钥    |
| `STRAVA_REFRESH_TOKEN` | Strava Refresh Token |

### 同步机制

- **定时同步**: 每日 UTC 0:00 (北京时间 8:00)
- **手动触发**: Actions 页面手动运行
- **数据持久化**: SQLite 数据库自动提交到 `data/activities.db`
- **优先级**: Strava > Nike

## 开发命令

```bash
bun run dev          # 启动开发服务器
bun run build        # 构建生产版本
bun run sync         # 手动同步数据

bun run lint         # 代码检查
bun run format       # 格式化代码
bun run type-check   # 类型检查

bun run db:push      # 推送 Schema
bun run db:generate  # 生成迁移文件
bun run db:studio    # Drizzle Studio
```

## 项目结构

```
src/
├── app/           # Next.js App Router 路由
├── components/    # React 组件
├── lib/           # 核心库 (数据库、API、工具函数)
├── stores/        # Jotai 状态管理
├── hooks/         # 自定义 Hooks
└── types/         # TypeScript 类型定义

data/
└── activities.db  # SQLite 数据库 (Git 持久化)
```

## Credits

[yihong0618/running_page](https://github.com/yihong0618/running_page)

## License

MIT
