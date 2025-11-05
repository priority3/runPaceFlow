# RunPaceFlow

一个现代化的跑步记录与分析平台，专注于配速分析和地图可视化。

## 特性

- 🏃 Nike Run Club 数据自动同步
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

# Nike Run Club
NIKE_ACCESS_TOKEN=your_nike_access_token

# Database
DATABASE_URL=file:./local.db
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
