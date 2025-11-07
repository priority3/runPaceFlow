# RunPaceFlow

一个现代化的跑步记录与分析平台，专注于配速分析和地图可视化。

## 特性

- 🏃 多平台数据自动同步（Strava / Nike Run Club）
- ⏰ GitHub Actions 定时自动同步
- 🗺️ 基于 MapLibre 的地图展示
- 📊 详细的配速分析和可视化
- 🎬 简化的路线回放动画
- 📱 响应式设计

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion
- **状态管理**: Jotai, TanStack Query
- **数据库**: SQLite (开发) / Turso (生产), Drizzle ORM
- **API**: tRPC, Zod
- **地图**: MapLibre GL JS, react-map-gl, @turf/turf
- **图表**: Recharts

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件：

```bash
# MapLibre (无需 token，使用开源样式)
NEXT_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json

# 数据源配置 (二选一，优先使用 Strava)

# Option 1: Strava (推荐)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

# Option 2: Nike Run Club
NIKE_REFRESH_TOKEN=your_refresh_token  # 推荐，可自动刷新
# 或
NIKE_ACCESS_TOKEN=your_access_token    # 手动模式，1-2小时过期

# Database
DATABASE_URL=file:./local.db
```

### GitHub Actions 自动同步配置

本项目支持通过 GitHub Actions 自动同步运动数据，无需手动操作。

#### 1. 配置 GitHub Secrets

在你的 GitHub 仓库中设置以下 Secrets (`Settings` -> `Secrets and variables` -> `Actions`):

**Strava 配置（推荐）：**

- `STRAVA_CLIENT_ID`: 你的 Strava 客户端 ID
- `STRAVA_CLIENT_SECRET`: 你的 Strava 客户端密钥
- `STRAVA_REFRESH_TOKEN`: 你的 Strava refresh token

**Nike 配置（备选）：**

- `NIKE_REFRESH_TOKEN`: 你的 Nike refresh token（推荐）
- 或 `NIKE_ACCESS_TOKEN`: 你的 Nike access token

**数据库配置：**

- `DATABASE_URL`: 数据库连接地址（使用 Turso 或其他远程数据库）

#### 2. 自动同步机制

- **定时同步**：每天 UTC 0:00（北京时间上午 8:00）自动执行
- **手动触发**：在 GitHub Actions 页面可手动触发同步
- **优先级**：Strava > Nike（如果两者都配置，优先使用 Strava）

#### 3. 本地手动同步（可选）

如果需要本地测试同步功能：

```bash
bun run sync
```

### 初始化数据库

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 同步运动数据
pnpm sync

# 代码检查和格式化
pnpm lint
pnpm format
pnpm type-check

# 数据库操作
pnpm db:generate  # 生成迁移文件
pnpm db:push      # 推送 schema 到数据库
pnpm db:studio    # 打开 Drizzle Studio
```

## 项目结构

```
runPaceFlow/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   ├── lib/              # 核心库
│   ├── stores/           # Jotai 状态
│   ├── hooks/            # 自定义 Hooks
│   └── types/            # 类型定义
├── drizzle/              # 数据库迁移
└── public/               # 静态资源
```

## 文档

- [MVP 实施计划](./MVP_PLAN.md)
- [技术规范](./TECHNICAL_SPECIFICATION.md)
- [对话记录](./CONVERSATION_LOG.md)

## License

MIT
