# RunPaceFlow - 技术方案文档

## 📋 项目概述

**RunPaceFlow** 是一个现代化的运动记录可视化展示端。它从 RunPaceFlow Admin 管理的活动数据库和运行时配置读取数据，提供地图交互、配速分析和 AI 智能建议功能；数据接入、第三方平台凭据和自动化工作流由 admin 侧统一负责。

数据流
https://github.com/superleeyom/blog/issues/54

### 核心特性

- 🗺️ **增强地图交互**: 动态路线回放、实时配速显示、3D 地形视图
- 📊 **配速分析**: 每公里配速图表、最快配速标记、配速区间分析
- 🤖 **AI 智能建议**: 基于训练数据的个性化建议、受伤风险预警
- 🎨 **现代化 UI**: 基于 shadcn/ui 的精美界面、深色模式支持
- 🔒 **只读展示边界**: 前台只读取已入库活动和 admin 导出的运行时配置
- 📱 **响应式设计**: 完美适配移动端和桌面端

---

## 🛠 技术栈

### 前端框架

- **Next.js 15+** - React 全栈框架，支持 App Router
- **React 19** - 最新的 React 特性
- **TypeScript** - 类型安全

### UI 层

- **Tailwind CSS 4** - 原子化 CSS 框架
- **shadcn/ui** - 高质量的 React 组件库
- **Framer Motion** - 流畅的动画库
- **Lucide Icons** - 现代化图标库

### 地图可视化

- **Mapbox GL JS** - 高性能地图渲染
- **react-map-gl** - React Mapbox 封装
- **deck.gl** - 大数据可视化层（可选）
- **turf.js** - 地理空间计算

### 数据管理

- **tRPC** - 类型安全的 API 层
- **TanStack Query** - 数据获取和缓存
- **Zustand** - 轻量级状态管理
- **Drizzle ORM** - 类型安全的 ORM

### 数据库

- **Turso (libSQL)** - 分布式 SQLite
- **SQLite** - 本地开发数据库

### AI 功能

- **OpenAI API** / **Anthropic Claude** - AI 建议生成
- **LangChain** - AI 应用框架（可选）
- **Vercel AI SDK** - AI 流式响应

### 数据接入边界

- **RunPaceFlow Admin** - 统一管理数据接入、平台凭据和 PR Agent 工作流
- **Runtime settings export** - 前台通过 admin 导出的配置读取数据库和目标设置
- **libSQL / SQLite** - 前台只读活动库并渲染展示体验

### 开发工具

- **Biome** - 代码格式化和检查
- **Lefthook** - Git hooks 管理
- **Drizzle Kit** - 数据库迁移
- **Bun / pnpm** - 包管理器

### 部署

- **Vercel** - 主要部署平台
- **GitHub Actions** - CI/CD 自动化
- **Umami** - 隐私友好的分析工具

---

## 📁 项目结构

```
runPaceFlow/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # 国际化路由
│   │   │   ├── (main)/              # 主应用布局
│   │   │   │   ├── page.tsx         # 首页 - 总览地图
│   │   │   │   ├── activities/      # 活动列表
│   │   │   │   ├── activity/[id]/   # 单个活动详情
│   │   │   │   ├── stats/           # 统计分析
│   │   │   │   └── settings/        # 设置页面
│   │   │   └── layout.tsx
│   │   ├── api/                      # API Routes
│   │   │   ├── trpc/[trpc]/         # tRPC 端点
│   │   │   ├── runtime-config/      # 运行时配置端点
│   │   │   └── ai/                  # AI 建议端点
│   │   └── layout.tsx
│   │
│   ├── components/                   # React 组件
│   │   ├── ui/                      # shadcn/ui 组件
│   │   ├── map/                     # 地图相关组件
│   │   │   ├── RunMap.tsx           # 主地图组件
│   │   │   ├── RoutePlayer.tsx      # 路线回放
│   │   │   ├── PaceMarker.tsx       # 配速标记
│   │   │   └── MapControls.tsx      # 地图控制
│   │   ├── activity/                # 活动相关组件
│   │   │   ├── ActivityCard.tsx     # 活动卡片
│   │   │   ├── PaceChart.tsx        # 配速图表
│   │   │   ├── SplitsTable.tsx      # 分段时间表
│   │   │   └── ActivityStats.tsx    # 活动统计
│   │   ├── ai/                      # AI 相关组件
│   │   │   ├── AIInsights.tsx       # AI 洞察
│   │   │   ├── TrainingAdvice.tsx   # 训练建议
│   │   │   └── InjuryWarning.tsx    # 受伤预警
│   │   └── layout/                  # 布局组件
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/                         # 工具库
│   │   ├── utils.ts                 # 通用工具
│   │   ├── pace.ts                  # 配速计算
│   │   ├── gpx-parser.ts            # GPX 解析
│   │   └── map-utils.ts             # 地图工具
│   │
│   ├── server/                      # 服务端代码
│   │   ├── db/                      # 数据库
│   │   │   ├── schema.ts            # 数据库模型
│   │   │   ├── migrations/          # 数据库迁移
│   │   │   └── index.ts
│   │   ├── api/                     # API 逻辑
│   │   │   ├── routers/             # tRPC 路由
│   │   │   │   ├── activity.ts
│   │   │   │   ├── stats.ts
│   │   │   │   └── ai.ts
│   │   │   └── root.ts
│   │   └── services/                # 业务逻辑
│   │       ├── activity-service.ts
│   │       ├── runtime-config.ts
│   │       └── ai-service.ts
│   │
│   ├── stores/                      # Zustand 状态管理
│   │   ├── map-store.ts            # 地图状态
│   │   ├── activity-store.ts       # 活动状态
│   │   └── ui-store.ts             # UI 状态
│   │
│   ├── types/                       # TypeScript 类型定义
│   │   ├── activity.ts
│   │   ├── map.ts
│   │   └── api.ts
│   │
│   ├── hooks/                       # 自定义 Hooks
│   │   ├── use-activities.ts
│   │   ├── use-map.ts
│   │   └── use-pace-analysis.ts
│   │
│   └── styles/                      # 样式文件
│       └── globals.css
│
├── scripts/                         # 本地诊断脚本
│   ├── check-turso.ts
│   └── debug-map.ts
│
├── public/                          # 静态资源
│   ├── icons/
│   └── images/
│
├── .github/
│   └── workflows/
│       └── deploy.yml              # 部署流程
│
├── drizzle/                        # 数据库相关
│   └── migrations/
│
├── messages/                        # 国际化文件
│   ├── en.json
│   └── zh.json
│
├── .env.example                    # 环境变量示例
├── .env.local                      # 本地环境变量
├── next.config.js                  # Next.js 配置
├── tailwind.config.ts              # Tailwind 配置
├── tsconfig.json                   # TypeScript 配置
├── drizzle.config.ts              # Drizzle 配置
└── package.json
```

---

## 🗄️ 数据库设计

### 核心表结构

```typescript
// activities 表 - 活动记录
{
  id: string (uuid)
  user_id: string
  title: string
  description: text?
  type: enum ('running', 'cycling', 'walking')
  start_time: timestamp
  end_time: timestamp
  duration: integer (秒)
  distance: float (米)
  elevation_gain: float (米)
  average_pace: float (秒/公里)
  best_pace: float (秒/公里)
  average_heart_rate: integer?
  max_heart_rate: integer?
  calories: integer?
  source: enum ('garmin', 'strava', 'nike', 'manual')
  source_id: string?
  gpx_data: text (JSON)
  splits: text (JSON)
  created_at: timestamp
  updated_at: timestamp
}

// splits 表 - 分段数据
{
  id: string (uuid)
  activity_id: string (FK)
  split_number: integer
  distance: float (米)
  duration: integer (秒)
  pace: float (秒/公里)
  elevation_gain: float (米)
  heart_rate_avg: integer?
  created_at: timestamp
}

// pace_zones 表 - 配速区间
{
  id: string (uuid)
  activity_id: string (FK)
  zone_name: string ('Z1', 'Z2', 'Z3', 'Z4', 'Z5')
  min_pace: float
  max_pace: float
  duration: integer (秒)
  distance: float (米)
  percentage: float
  created_at: timestamp
}

// ai_insights 表 - AI 建议
{
  id: string (uuid)
  user_id: string
  activity_id: string? (FK)
  insight_type: enum ('training', 'injury_warning', 'goal', 'recovery')
  content: text
  metadata: text (JSON)
  created_at: timestamp
  read_at: timestamp?
}

// user_stats 表 - 用户统计
{
  id: string (uuid)
  user_id: string
  total_activities: integer
  total_distance: float (米)
  total_duration: integer (秒)
  total_elevation: float (米)
  best_pace: float (秒/公里)
  longest_run: float (米)
  current_week_distance: float
  current_month_distance: float
  updated_at: timestamp
}
```

---

## 🎨 核心功能设计

### 1. 地图交互与动画

#### 路线回放功能

```typescript
// RoutePlayer.tsx
- 播放/暂停控制
- 速度调节（0.5x, 1x, 2x, 5x）
- 进度条拖拽
- 实时显示当前位置的配速、心率、海拔
- 配速颜色映射（快速=绿色，慢速=红色）
- 平滑的相机跟随
```

#### 配速可视化

```typescript
// 配速热力图
- 使用渐变色表示不同配速区间
- 绿色: 快速（< 平均配速 - 30秒）
- 黄色: 正常（平均配速 ± 30秒）
- 橙色: 慢速（> 平均配速 + 30秒）
- 红色: 很慢（> 平均配速 + 60秒）

// 每公里标记
- 在路线上每公里添加标记点
- 点击标记显示该公里的详细数据
- 标记颜色根据配速变化
```

#### 3D 地形视图

```typescript
// 可选功能
- 切换 2D/3D 视图
- 显示海拔变化
- 坡度可视化
```

### 2. 配速分析系统

#### 配速图表

```typescript
// PaceChart.tsx
interface PaceChartData {
  kilometer: number;
  pace: number; // 秒/公里
  heartRate?: number;
  elevation?: number;
}

// 功能:
- 每公里配速折线图
- 平均配速参考线
- 最快配速标记
- 配速区间填充
- 可缩放、可拖拽
- 悬停显示详细数据
```

#### 配速统计

```typescript
// 关键指标
- 平均配速
- 最快配速（1km、5km、10km PR）
- 配速标准差（一致性指标）
- 配速区间分布
- 负分段检测（后半程加速）
- 配速下降率
```

#### 分段数据表

```typescript
// SplitsTable.tsx
每公里显示:
- 公里数
- 用时
- 配速
- 与平均配速差异
- 配速趋势（↑↓）
- 海拔变化
- 平均心率
```

### 3. AI 智能建议系统

#### 训练建议

```typescript
// AI 分析内容
- 训练负荷评估（是否过度训练）
- 配速一致性分析
- 建议的配速区间
- 下次训练计划
- 长期目标建议

// 输入数据
- 最近 30 天的活动记录
- 配速变化趋势
- 训练频率
- 恢复时间
```

#### 受伤风险预警

```typescript
// 预警指标
- 训练量突然增加（>10% 每周）
- 连续多天高强度训练
- 配速下降趋势
- 恢复时间不足

// AI 建议
- 休息建议
- 降低强度建议
- 交叉训练建议
```

#### 目标达成分析

```typescript
// 目标类型
;-完成马拉松 / 半马 -
  提升配速 -
  增加跑量 -
  减重目标 -
  // AI 反馈
  当前进度 -
  预测完成时间 -
  训练计划调整
```

### 4. 数据接入边界

#### 前台职责

```typescript
// RunPaceFlow
- 读取共享活动库
- 展示活动列表、统计、地图路线和详情页
- 从 admin 拉取运行时配置和目标设置
- 生成或读取 AI 运动洞察
```

#### Admin 职责

```typescript
// RunPaceFlow Admin
- 管理第三方平台凭据
- 执行活动数据接入和回填
- 管理 PR Agent 工作流
- 导出前台运行所需配置
```

---

## 🎨 UI/UX 设计原则

### 设计风格

- **简洁现代**: 采用卡片式布局，留白充足
- **数据驱动**: 重点突出关键数据，次要信息弱化
- **色彩系统**:
  - 主色: 蓝色系（运动感）
  - 辅助色: 绿色（好）、橙色（警告）、红色（危险）
  - 深色模式: OLED 友好的纯黑背景

### 关键页面设计

#### 首页 - 总览地图

```
- 顶部: 统计卡片（总里程、本周跑量、本月跑量）
- 中间: 大地图显示所有跑步路线
- 底部: 最近活动列表
- 右侧: 训练焦点、目标、路线和活动列表入口
```

#### 活动详情页

```
- 顶部: 活动标题、时间、关键数据
- 地图区域: 带回放功能的路线图
- 配速分析区: 配速图表、分段表
- AI 建议区: 智能洞察卡片
- 底部: 相似活动推荐
```

#### 统计分析页

```
- 时间筛选器（周/月/年/全部）
- 趋势图表（距离、配速、心率）
- 个人记录（PR 列表）
- 月度统计日历
- 配速区间分布图
```

### 响应式设计

```
Desktop (≥1024px):
- 侧边栏导航
- 多列布局
- 大地图视图

Tablet (768px - 1023px):
- 顶部导航栏
- 两列布局
- 中等地图视图

Mobile (< 768px):
- 底部标签栏
- 单列布局
- 紧凑地图视图
- 滑动查看更多
```

---

## 🔌 API 设计

### tRPC Router 结构

```typescript
// activities router
trpc.activities.list // 获取活动列表
trpc.activities.listInfinite // 获取无限滚动活动列表
trpc.activities.getById // 获取单个活动
trpc.activities.getSplits // 获取分段数据
trpc.activities.getWithSplits // 获取活动和分段详情
trpc.activities.getGpxData // 获取活动 GPX 数据
trpc.activities.getStats // 获取训练统计
trpc.activities.getMapRoutes // 获取首页地图路线

// insights router
trpc.insights.getForActivity // 获取缓存 AI 洞察
```

### REST API

```
GET  /api/runtime-config            // 获取公开运行时配置
GET  /api/runtime-config/stream     // 运行时配置 SSE 更新
GET  /api/insights/stream           // AI 洞察流式生成
```

---

## 🚀 开发路线图

### Phase 1 - MVP (4-6 周)

**目标**: 基本的活动展示和数据读取

- [ ] 搭建 Next.js 项目框架
- [ ] 设计并实现数据库 schema
- [ ] 实现基础的地图展示
- [ ] 实现活动列表和详情页
- [ ] 接入 admin 管理的活动库
- [ ] 基础的配速图表展示
- [ ] 响应式布局

### Phase 2 - 增强功能 (4-6 周)

**目标**: 核心地图交互和配速分析

- [ ] 路线回放动画
- [ ] 配速热力图
- [ ] 每公里标记点
- [ ] 完整的配速分析系统
- [ ] 分段数据表
- [ ] 统计分析页面
- [ ] 扩展 admin 数据接入能力

### Phase 3 - AI 功能 (3-4 周)

**目标**: AI 智能建议

- [ ] 集成 OpenAI/Claude API
- [ ] 训练建议生成
- [ ] 受伤风险预警
- [ ] 目标达成分析
- [ ] AI 对话界面（可选）

### Phase 4 - 优化与扩展 (持续)

**目标**: 用户体验优化

- [ ] 性能优化（大量数据）
- [ ] 3D 地形视图
- [ ] 社交功能（关注、点赞）
- [ ] 活动分享功能
- [ ] 移动端 PWA
- [ ] 数据导出功能
- [ ] 更多运动类型支持

---

## 🔐 环境变量配置

```bash
# .env.example

# Database
DATABASE_PROVIDER="turso"           # sqlite | turso
DATABASE_URL="file:./db.sqlite"
TURSO_DATABASE_URL=""
TURSO_DATABASE_TOKEN=""

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=""

# AI Services
OPENAI_API_KEY=""                   # 或 ANTHROPIC_API_KEY
AI_MODEL="gpt-4o-mini"              # 或 claude-3-5-sonnet

# Admin runtime config
RUNPACEFLOW_ADMIN_URL="http://localhost:3030"
CONFIG_EXPORT_TOKEN=""

# Analytics
NEXT_PUBLIC_UMAMI_ANALYTICS_ID=""
NEXT_PUBLIC_UMAMI_ANALYTICS_JS=""

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
```

---

## 📊 性能优化策略

### 前端优化

- **代码分割**: 路由级别的动态导入
- **图片优化**: Next.js Image 组件，WebP 格式
- **数据预取**: TanStack Query 预取机制
- **虚拟滚动**: 大量活动列表使用虚拟滚动
- **懒加载**: 地图和图表组件懒加载

### 地图优化

- **瓦片缓存**: Mapbox 瓦片缓存策略
- **路线简化**: 简化 GPX 坐标点（Douglas-Peucker 算法）
- **聚合显示**: 大量活动时使用聚合显示
- **WebGL 渲染**: 充分利用 GPU 加速

### 数据库优化

- **索引**: 在常用查询字段添加索引
- **分页**: 活动列表使用游标分页
- **缓存**: 统计数据使用 Redis 缓存（可选）
- **只读查询**: 前台避免写入型批处理，活动接入由 admin 承担

### AI 请求优化

- **流式响应**: 使用 AI SDK 的流式输出
- **缓存建议**: 相似训练数据缓存 AI 建议
- **后台任务**: AI 分析放入后台队列
- **成本控制**: 使用更便宜的模型（GPT-4o-mini）

---

## 🧪 测试策略

### 单元测试

- 配速计算逻辑
- GPX 解析器
- 数据转换函数

### 集成测试

- API 端点测试
- 数据库操作测试
- 活动库读取和运行时配置读取测试

### E2E 测试

- 关键用户流程
- 地图交互测试
- 数据上传流程

### 测试工具

- **Vitest** - 单元测试
- **Playwright** - E2E 测试
- **React Testing Library** - 组件测试

---

## 📦 部署方案

### Vercel 部署 (推荐)

```bash
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署
```

### 自托管部署

```bash
# 使用 Docker
docker build -t runpaceflow .
docker run -p 3000:3000 runpaceflow

# 或使用 PM2
pnpm build
pm2 start npm --name "runpaceflow" -- start
```

### CI/CD 流程

```yaml
# .github/workflows/deploy.yml
- 代码检查（Biome）
- 类型检查（TypeScript）
- 运行测试
- 构建项目
- 部署到 Vercel
```

---

## 🔒 安全考虑

### 数据安全

- 敏感信息加密存储
- API Token 定期轮换
- 用户数据隔离

### API 安全

- Rate limiting
- CORS 配置
- CSRF 保护
- SQL 注入防护（Drizzle ORM）

### 隐私保护

- 可选的路线模糊化
- 起点/终点隐藏选项
- 数据导出和删除功能
- GDPR 合规

---

## 📚 参考资源

### 技术文档

- [Next.js Documentation](https://nextjs.org/docs)
- [Mapbox GL JS API](https://docs.mapbox.com/mapbox-gl-js/api/)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)

### 灵感来源

- [running_page](https://github.com/yihong0618/running_page)
- [cyc-earth](https://github.com/sun0225SUN/cyc-earth)
- RunPaceFlow Admin

---

## 📝 待确认事项

### 技术选型

- [ ] AI 服务选择: OpenAI vs Claude vs 本地模型
- [ ] 数据库: Turso vs PostgreSQL vs SQLite
- [ ] 认证方案: NextAuth.js vs Clerk vs 自研

### 功能优先级

- [ ] 社交功能是否纳入 MVP
- [ ] 是否支持多用户
- [ ] 是否需要移动端 App

### 设计细节

- [ ] 主题色确认
- [ ] Logo 设计
- [ ] 品牌命名最终确认

---

## 🎯 成功指标

### 技术指标

- 首屏加载时间 < 2s
- Lighthouse 性能分数 > 90
- 地图帧率 > 30fps
- API 响应时间 < 200ms

### 用户指标

- 活动上传成功率 > 99%
- 活动展示准确率 > 99.9%
- 用户留存率 (Week 1) > 60%
- AI 建议有用性评分 > 4/5

---

## 🤝 贡献指南

### 开发流程

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

### 代码规范

- 使用 Biome 格式化代码
- TypeScript strict 模式
- 组件使用函数式组件
- 优先使用 Server Components

### 提交规范

- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建工具

---

**文档版本**: v1.0
**最后更新**: 2025-01-04
**维护者**: RunPaceFlow Team
