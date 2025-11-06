# RunPaceFlow MVP 实施计划

**版本**: v3.0 (极简版)
**创建日期**: 2025-01-04
**更新日期**: 2025-01-05
**预计周期**: 3-4 周
**目标**: 构建单用户跑步记录系统，验证核心功能

---

## 目录

1. [版本变更说明](#版本变更说明)
2. [功能范围](#功能范围)
3. [技术架构](#技术架构)
4. [项目结构](#项目结构)
5. [数据库设计](#数据库设计)
6. [核心组件设计](#核心组件设计)
7. [开发时间线](#开发时间线)
8. [验收标准](#验收标准)
9. [快速开始](#快速开始)
10. [FAQ](#faq)

---

## 版本变更说明

### v3.0 主要变更

- 🗑️ **移除设置页面** - 通过环境变量配置 Nike token
- 🎮 **简化路线回放** - 移除进度条/速度调节，仅保留播放按钮
- 🗺️ **MapLibre 替代 Mapbox** - 开源免费方案
- ⏱️ **缩短周期** - 从 4-5 周缩短到 3-4 周

### MVP 核心目标

- ✅ Nike Run Club 数据自动同步
- ✅ 地图展示和简化路线回放
- ✅ 配速分析和可视化
- ✅ 响应式设计

---

## 功能范围

### ✅ 包含功能

| 功能模块   | 描述                                   |
| ---------- | -------------------------------------- |
| 数据同步   | Nike Run Club 自动同步（环境变量配置） |
| 地图展示   | 基于 MapLibre 的地图渲染               |
| 路线回放   | ActivityCard 播放按钮触发动画绘制      |
| 配速可视化 | 渐变色路线 + 每公里标记点              |
| 配速分析   | 每公里配速图表 + 分段数据表            |
| 响应式设计 | 移动端和桌面端适配                     |

### ❌ 不包含功能

- 设置页面（环境变量配置）
- 复杂播放控制器（进度条、速度调节）
- AI 智能建议
- 多用户系统
- 社交功能
- 移动端 Native App
- 3D 地形视图
- Strava/Garmin（预留接口）

---

## 技术架构

### 技术栈选型

```yaml
前端:
  框架: Next.js 15 (App Router) + React 19 + TypeScript
  UI: Tailwind CSS 4 + shadcn/ui + Radix UI
  动画: Framer Motion (按需)

状态管理:
  Jotai: 原子化状态管理
  TanStack Query: 数据获取和缓存

后端:
  API: tRPC + Zod
  数据库: SQLite (开发) / Turso (生产)
  ORM: Drizzle ORM

地图:
  MapLibre GL JS: 开源地图渲染
  react-map-gl: React 封装
  @turf/turf: 地理计算

图表:
  Recharts: 配速图表

工具:
  pnpm: 包管理
  ESLint + Prettier: 代码质量
```

### 关键技术决策

**MapLibre vs Mapbox**

- ✅ 完全免费开源
- ✅ API 与 Mapbox GL JS 兼容
- ✅ 样式兼容 Mapbox
- ✅ 无使用限制

**适配器模式**

- 统一数据源接口
- Nike 优先实现
- Strava/Garmin 预留扩展

---

## 项目结构

```
runPaceFlow/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (main)/
│   │   │   ├── page.tsx         # 首页（活动列表 + 地图）
│   │   │   └── activity/[id]/   # 活动详情
│   │   └── api/trpc/[trpc]/     # tRPC 端点
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 组件
│   │   ├── map/                 # 地图组件
│   │   │   ├── RunMap.tsx
│   │   │   ├── RouteLayer.tsx
│   │   │   ├── MarkerLayer.tsx
│   │   │   └── AnimatedRoute.tsx
│   │   ├── activity/            # 活动组件
│   │   │   ├── ActivityCard.tsx # 带播放按钮
│   │   │   ├── PaceChart.tsx
│   │   │   └── SplitsTable.tsx
│   │   └── layout/
│   │       └── Header.tsx
│   │
│   ├── lib/
│   │   ├── db/                  # 数据库
│   │   │   ├── schema.ts
│   │   │   └── client.ts
│   │   ├── trpc/                # tRPC
│   │   │   ├── server.ts
│   │   │   └── routers/
│   │   ├── sync/                # 数据同步
│   │   │   ├── adapters/
│   │   │   │   ├── base.ts      # 适配器接口
│   │   │   │   └── nike.ts      # Nike 适配器
│   │   │   ├── parser.ts        # GPX 解析
│   │   │   └── processor.ts     # 数据处理
│   │   ├── pace/                # 配速计算
│   │   │   ├── calculator.ts
│   │   │   └── analyzer.ts
│   │   └── utils/
│   │
│   ├── stores/                  # Jotai 状态
│   │   ├── ui.ts
│   │   └── map.ts
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── use-activities.ts
│   │   ├── use-activity-detail.ts
│   │   └── use-route-animation.ts
│   │
│   └── types/                   # 类型定义
│       ├── activity.ts
│       └── map.ts
│
└── drizzle/                     # 数据库迁移
```

---

## 数据库设计

### 核心表结构

#### 1. activities (活动表)

```typescript
{
  id: text(主键)
  title: text
  type: text // 'running' | 'cycling' | 'walking'
  source: text // 'nike' | 'strava' | 'garmin'
  sourceId: text // 原始平台ID

  startTime: timestamp
  endTime: timestamp
  duration: integer // 秒
  distance: real // 米

  averagePace: real // 秒/公里
  bestPace: real // 秒/公里
  elevationGain: real // 米

  averageHeartRate: integer
  maxHeartRate: integer
  calories: integer

  gpxData: text // 完整 GPX XML

  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 2. splits (分段表)

```typescript
{
  id: text(主键)
  activityId: text(外键)
  kilometer: integer // 第几公里
  duration: integer // 秒
  pace: real // 秒/公里
  distance: real // 米
  elevationGain: real
  averageHeartRate: integer
  createdAt: timestamp
}
```

#### 3. userProfile (用户配置)

```typescript
{
  id: text(主键)
  name: text
  avatar: text

  syncSource: text
  nikeAccessToken: text
  stravaAccessToken: text
  garminSecretString: text

  lastSyncAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### 4. syncLogs (同步日志)

```typescript
{
  id: text(主键)
  source: text
  status: text // 'success' | 'failed' | 'running'
  activitiesCount: integer
  errorMessage: text
  startedAt: timestamp
  completedAt: timestamp
}
```

---

## 核心组件设计

### 1. 适配器模式（核心架构）

#### 基础接口

```typescript
// src/lib/sync/adapters/base.ts
export interface SyncAdapter {
  name: string
  authenticate(credentials: Record<string, any>): Promise<boolean>
  getActivities(options?: { startDate?: Date; endDate?: Date; limit?: number }): Promise<RawActivity[]>
  getActivityDetail(id: string): Promise<RawActivity>
  downloadGPX(activityId: string): Promise<string>
  healthCheck(): Promise<boolean>
}

export interface RawActivity {
  id: string
  title: string
  type: 'running' | 'cycling' | 'walking'
  startTime: Date
  duration: number // 秒
  distance: number // 米
  gpxData?: string
  averagePace?: number
  source: string
}
```

#### Nike 适配器实现

```typescript
// src/lib/sync/adapters/nike.ts
export class NikeAdapter implements SyncAdapter {
  name = 'nike'
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async getActivities(options = {}): Promise<RawActivity[]> {
    const response = await fetch('https://api.nike.com/...', {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    const data = await response.json()
    return data.activities.map(this.transformActivity)
  }

  // ... 其他方法实现
}
```

### 2. 路线回放组件

```typescript
// src/components/map/AnimatedRoute.tsx

/**
 * 简化的路线回放组件
 * 功能：
 * 1. 从起点到终点的动画绘制
 * 2. 显示浮动信息卡（当前配速、距离、时间）
 * 3. 动画完成后显示完整的配速渐变色路线
 */
export function AnimatedRoute({
  coordinates: Coordinate[],
  paceData: PaceData[],
  onAnimationComplete?: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 使用 requestAnimationFrame 实现平滑动画
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      setCurrentIndex(prev => {
        if (prev >= coordinates.length - 1) {
          onAnimationComplete?.();
          return prev;
        }
        return prev + 1;
      });
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [isPlaying, currentIndex]);

  return (
    <>
      <Source data={currentRouteData}>
        <Layer {...routeLayerStyle} />
      </Source>
      <FloatingInfoCard
        pace={currentPace}
        distance={currentDistance}
        time={currentTime}
      />
    </>
  );
}
```

### 3. 页面交互设计

#### 首页布局

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ [总里程] [本周] [活动数]              │
├─────────────────────────────────────┤
│ 活动列表       │    地图              │
│                │                     │
│ ┌────────────┐ │  ┌───────────────┐ │
│ │ 晨跑 5.2km │ │  │               │ │
│ │ ▶ 播放     │ │  │   所有路线     │ │
│ │ 5:30/km    │ │  │               │ │
│ └────────────┘ │  └───────────────┘ │
│                │                     │
└─────────────────────────────────────┘
```

**交互流程**:

1. 点击 ActivityCard 的 **▶ 播放** 按钮
2. 右侧地图聚焦到该活动路线
3. 开始动画绘制路线
4. 显示浮动信息卡（实时配速/距离/时间）
5. 动画完成，显示完整配速渐变色路线

#### 活动详情页

```
┌─────────────────────────────────────┐
│ ← 返回  晨跑 - 2025-01-04  ▶ 播放  │
├─────────────────────────────────────┤
│ [距离] [用时] [配速] [心率] [爬升]   │
├─────────────────────────────────────┤
│                                     │
│    地图（配速渐变色路线）             │
│                                     │
├─────────────────────────────────────┤
│    配速图表                          │
├─────────────────────────────────────┤
│    分段数据表                        │
└─────────────────────────────────────┘
```

---

## 开发时间线

### Week 1: 数据层 + Nike 同步 (5-7天)

**Day 1-2: 项目初始化**

- [ ] 创建 Next.js 项目
- [ ] 配置 TypeScript、Tailwind、ESLint
- [ ] 安装核心依赖（MapLibre、Jotai、tRPC等）
- [ ] 设置项目结构

**Day 3-4: 数据库**

- [ ] 设计 Drizzle schema（4张表）
- [ ] 实现数据库迁移
- [ ] 编写数据访问层

**Day 5-7: Nike 同步**

- [ ] 实现适配器接口
- [ ] Nike Adapter 开发
- [ ] GPX 解析器
- [ ] 配速计算服务
- [ ] 测试数据同步

**里程碑 M1**: Nike 数据成功同步到数据库

---

### Week 2: API 层 + 前端基础 (5-7天)

**Day 1-2: tRPC API**

- [ ] 配置 tRPC
- [ ] 实现 activity router
  - `activity.list` - 获取活动列表
  - `activity.getById` - 获取活动详情
  - `activity.getSplits` - 获取分段数据

**Day 3-5: 前端基础**

- [ ] 集成 shadcn/ui
- [ ] 创建布局组件（Header）
- [ ] 创建基础 UI 组件
- [ ] 配置 Jotai 状态管理
- [ ] 设置 TanStack Query

**Day 6-7: 活动列表页**

- [ ] ActivityCard 组件（带播放按钮）
- [ ] StatsCard 组件
- [ ] 活动列表页面
- [ ] 加载状态、错误处理

**里程碑 M2**: 活动列表页面完成，播放按钮正常工作

---

### Week 3: 地图可视化 + 简化回放 (5-7天)

**Day 1-2: 基础地图**

- [ ] 集成 MapLibre GL JS
- [ ] 创建 RunMap 组件
- [ ] 路线绘制（LineString）

**Day 3-4: 配速可视化**

- [ ] 配速颜色映射算法
- [ ] 渐变色路线渲染
- [ ] 每公里标记点
- [ ] Popup 信息窗口

**Day 5-7: 简化路线回放**

- [ ] AnimatedRoute 组件
- [ ] 动画绘制（requestAnimationFrame）
- [ ] 播放按钮集成到 ActivityCard
- [ ] 浮动信息卡（配速/距离/时间）
- [ ] 动画完成后显示完整路线

**里程碑 M3**: 地图和简化回放功能完成

---

### Week 3-4: 配速分析 + 详情页 (5-7天)

**Day 1-3: 配速图表**

- [ ] 集成 Recharts
- [ ] PaceChart 组件
  - 每公里配速折线图
  - 平均配速参考线
  - 最快配速标记
- [ ] SplitsTable 组件
  - 分段数据表格
  - 高亮显示

**Day 4-7: 活动详情页 + 优化**

- [ ] 页面布局设计
- [ ] 集成地图和简化回放
- [ ] 集成配速图表和分段表
- [ ] 统计卡片
- [ ] 响应式布局优化
- [ ] 移动端适配
- [ ] 性能优化（路线简化、懒加载）

**里程碑 M4**: MVP 全功能完成

---

## 验收标准

### 功能验收

- [ ] Nike Run Club 数据成功同步（环境变量配置）
- [ ] 首页正确显示所有活动列表
- [ ] 活动卡片播放按钮正常工作
- [ ] 统计卡片数据准确
- [ ] 地图正确显示跑步路线
- [ ] 配速渐变色路线显示正确
- [ ] 简化路线回放动画流畅
- [ ] 动画过程中实时信息显示正确
- [ ] 配速图表准确显示
- [ ] 分段数据表完整
- [ ] 移动端响应式正常

### 性能标准

- [ ] 首屏加载 < 3 秒
- [ ] 地图渲染 > 30 fps
- [ ] API 响应 < 500ms
- [ ] 支持 100+ 活动无性能问题

### 代码质量

- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 关键功能有单元测试
- [ ] 代码注释完整

---

## 快速开始

### 1. 初始化项目

```bash
# 创建 Next.js 项目
npx create-next-app@latest runPaceFlow \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd runPaceFlow

# 安装核心依赖
pnpm add @tanstack/react-query @trpc/client @trpc/server @trpc/react-query
pnpm add jotai drizzle-orm @libsql/client
pnpm add maplibre-gl react-map-gl @turf/turf
pnpm add recharts zod lucide-react framer-motion

# 安装 shadcn/ui
npx shadcn-ui@latest init

# 开发工具
pnpm add -D drizzle-kit vitest
```

### 2. 配置环境变量

```bash
# .env.local

# MapLibre (无需 token，使用开源样式)
NEXT_PUBLIC_MAP_STYLE=https://demotiles.maplibre.org/style.json

# Nike Run Club
NIKE_ACCESS_TOKEN=your_nike_access_token

# Database
DATABASE_URL=file:./local.db
# 生产环境使用 Turso
# DATABASE_URL=libsql://your-database.turso.io
# DATABASE_AUTH_TOKEN=your_auth_token
```

### 3. 启动开发

```bash
# 数据库迁移
pnpm drizzle-kit push

# 启动开发服务器
pnpm dev
```

---

## FAQ

### Q1: 为什么砍掉 AI 功能和设置页面？

**A**:

- AI 开发周期长（2周），成本高，对 MVP 验证不是必需的
- 设置页面可通过环境变量配置替代，节省开发时间
- 专注核心功能：数据同步、地图展示、配速分析

### Q2: 为什么优先 Nike Run Club？

**A**:

- 用户明确需求
- API 相对简单
- 数据质量好
- 适配器模式便于后续扩展 Strava/Garmin

### Q3: 为什么选择 MapLibre 而不是 Mapbox？

**A**:

- **完全免费**: MapLibre 是开源的，无使用限制
- **API 兼容**: 是 Mapbox GL JS 的分支，API 几乎相同
- **样式兼容**: 可以使用大部分 Mapbox 样式
- **社区支持**: 活跃的开源社区
- **成本考虑**: 避免了 Mapbox 的费用限制

### Q4: 简化的路线回放与原计划有什么区别？

**A**:

- **移除**: 进度条、速度调节、时间轴控制
- **保留**: 简单的播放按钮、动画绘制、实时信息显示
- **优势**: 开发更快、UI 更简洁、用户体验更直观

### Q5: 如何确保其他数据源易于扩展？

**A**:

- 使用适配器模式统一接口
- 定义清晰的 `SyncAdapter` 接口
- 数据格式统一转换为 `RawActivity`
- 预留 Strava/Garmin 接口，只需实现对应适配器

### Q6: 后续扩展计划是什么？

**A**:

- **Phase 2** (2-3周): Strava/Garmin 适配器、多用户支持
- **Phase 3** (1-2月): AI 智能建议、训练计划、社交功能
- **Phase 4** (长期): 移动端 App、3D 地形、比赛记录

---

**准备好了吗？开始 Week 1 开发！** 🚀

---

**文档版本**: v3.0
**最后更新**: 2025-01-05
**维护者**: RunPaceFlow Team
