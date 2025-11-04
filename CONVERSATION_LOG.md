# RunPaceFlow 项目对话记录

**项目名称**: RunPaceFlow
**创建时间**: 2025-01-04
**最后更新**: 2025-01-04

---

## 会话 #1: 项目初始化与技术方案制定

### 用户需求 (2025-01-04)

用户提供了两个参考项目：
1. [running_page](https://github.com/yihong0618/running_page) - 跑步数据记录和可视化
2. [cyc-earth](https://github.com/sun0225SUN/cyc-earth) - 骑行主页（Next.js 架构）

**核心需求**:
> 基于这两个项目构建一个新的跑步记录网站，在 running_page 的基础上加上：
> - 更好的地图交互动画
> - 显示每次跑步的全过程
> - 显示每公里的配速
> - 显示这次跑步的最快配速
> - AI 建议
> - 更好的页面 UI
> - 技术栈基于 Next.js

### 项目分析

#### running_page 项目特点
- **技术栈**: React + Vite + Python
- **核心功能**:
  - 支持多平台数据同步（Garmin, Strava, Nike Run Club 等）
  - 基于 Mapbox 的地图可视化
  - SVG 数据图表生成
  - GitHub Actions 自动化同步
- **数据格式**: 支持 GPX, TCX, FIT 文件

#### cyc-earth 项目特点
- **技术栈**: Next.js 15 + React 19 + TypeScript
- **现代化架构**:
  - Tailwind CSS 4
  - shadcn/ui 组件库
  - tRPC (类型安全的 API)
  - Drizzle ORM + Turso 数据库
  - Zustand 状态管理
  - next-intl 国际化
  - Biome 代码检查

### 技术方案文档创建

**文件**: `TECHNICAL_SPECIFICATION.md`

#### 主要内容

**1. 技术栈选择**
- 前端: Next.js 15 + React 19 + TypeScript
- UI: Tailwind CSS 4 + shadcn/ui + Framer Motion
- 地图: Mapbox GL JS + react-map-gl + turf.js
- 数据: tRPC + TanStack Query + Zustand
- 数据库: Turso (libSQL) + Drizzle ORM
- AI: OpenAI API / Anthropic Claude + Vercel AI SDK
- 数据同步: Python 3.11+ 脚本

**2. 核心功能设计**

##### 地图交互与动画
- 路线回放功能（播放/暂停/速度调节）
- 配速热力图（颜色映射：绿-快速，红-慢速）
- 每公里标记点（可点击查看详情）
- 3D 地形视图（可选）

##### 配速分析系统
- 每公里配速折线图
- 平均配速参考线
- 最快配速标记
- 配速区间分布
- 分段数据表
- 配速一致性指标

##### AI 智能建议
- 训练负荷评估
- 受伤风险预警
- 个性化训练计划
- 目标达成分析
- 基于最近 30 天数据分析

**3. 数据库设计**

核心表结构：
- `activities` - 活动记录（包含 GPX 数据、配速、心率等）
- `splits` - 分段数据（每公里的详细数据）
- `pace_zones` - 配速区间统计
- `ai_insights` - AI 建议记录
- `user_stats` - 用户总体统计

**4. 项目结构**

```
runPaceFlow/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React 组件
│   │   ├── ui/                # shadcn/ui 组件
│   │   ├── map/               # 地图组件
│   │   ├── activity/          # 活动组件
│   │   └── ai/                # AI 组件
│   ├── server/                # 服务端代码
│   │   ├── db/                # 数据库
│   │   ├── api/               # tRPC 路由
│   │   └── services/          # 业务逻辑
│   ├── stores/                # Zustand 状态
│   └── hooks/                 # 自定义 Hooks
├── scripts/                   # Python 同步脚本
└── messages/                  # 国际化文件
```

**5. 开发路线图**

- **Phase 1 (4-6周)**: MVP - 基本展示和数据同步
- **Phase 2 (4-6周)**: 地图交互和配速分析
- **Phase 3 (3-4周)**: AI 智能建议
- **Phase 4 (持续)**: 优化与扩展

**6. 关键页面设计**

- **首页**: 总览地图 + 统计卡片 + 最近活动
- **活动详情页**: 路线回放 + 配速图表 + AI 建议
- **统计分析页**: 趋势图表 + PR 列表 + 月度日历

**7. 性能优化策略**

- 代码分割、图片优化、数据预取
- 地图瓦片缓存、路线简化
- 数据库索引、分页、缓存
- AI 流式响应、请求缓存

---

## 待讨论事项

### 用户补充需求 (最新)

用户提供了三个参考项目的架构：
1. [Afilmory](https://github.com/Afilmory/afilmory)
2. [Shiro](https://github.com/Innei/Shiro)
3. [Folo](https://github.com/RSSNext/Folo)

**用户要求**:
- 参考这些项目的技术架构
- 制定具体的 MVP 方案
- 在 TECHNICAL_SPECIFICATION 中更新
- 进一步讨论方案细节

### 参考项目架构分析 (2025-01-04)

#### 1. Afilmory - 照片画廊网站

**技术架构特点**:
- **核心技术**: React 19 + Vite + TypeScript
- **状态管理**: Jotai (原子化状态)
- **数据获取**: TanStack Query
- **路由**: React Router 7
- **UI 框架**: Tailwind CSS + Radix UI
- **项目结构**: Monorepo (apps + packages)

**值得借鉴的点**:
- ✅ 适配器模式支持多存储后端 (S3, GitHub, 本地)
- ✅ 高性能 WebGL 图片渲染
- ✅ Worker Threads 并发处理
- ✅ 增量同步机制（智能变更检测）
- ✅ 插件化架构设计

#### 2. Shiro - 个人博客主题

**技术架构特点**:
- **核心技术**: Next.js (App Router) + TypeScript
- **状态管理**: Jotai
- **动画库**: Framer Motion (物理弹性动画)
- **UI 框架**: Tailwind CSS + Radix UI
- **实时通信**: Socket.IO
- **性能**: LightHouse 90+ 分

**值得借鉴的点**:
- ✅ Next.js App Router 最佳实践
- ✅ 极致的性能优化策略
- ✅ 优雅的动画系统
- ✅ 插件系统设计
- ✅ 轻量级管理面板

#### 3. Follow (Folo) - RSS 阅读器

**技术架构特点**:
- **项目结构**: Turborepo Monorepo
- **多平台**: Desktop (Electron) + Mobile (React Native) + Web
- **包管理**: pnpm workspace
- **构建工具**: Turbo
- **代码质量**: ESLint + Prettier

**值得借鉴的点**:
- ✅ 成熟的 Monorepo 架构
- ✅ 跨平台解决方案
- ✅ 完善的 CI/CD 流程
- ✅ 社区驱动的开发模式
- ✅ 多端代码复用

### 综合架构建议

基于三个项目的最佳实践，为 RunPaceFlow 推荐以下技术选型：

**前端框架**:
- Next.js 15 (App Router) - 借鉴 Shiro 的最佳实践
- React 19 - 使用最新特性
- TypeScript - 完整类型安全

**状态管理**:
- Jotai - 三个项目都在使用，轻量且强大
- TanStack Query - 数据获取和缓存

**UI 框架**:
- Tailwind CSS 4 - 现代化 CSS 方案
- Radix UI - 无障碍组件基础
- Framer Motion - 流畅动画（借鉴 Shiro）

**项目结构**:
- 简化的 Monorepo 结构（借鉴 Afilmory）
- 适配器模式支持多数据源（借鉴 Afilmory）
- 插件化设计（借鉴 Shiro）

### MVP 方案制定 (2025-01-04)

**MVP 周期**: 6-8 周
**核心目标**: 单用户跑步记录系统，验证核心功能

#### MVP 包含功能
✅ 数据同步（Strava + Garmin）
✅ 地图展示和路线回放
✅ 配速分析和可视化
✅ 基础 AI 建议
✅ 自动化同步

#### MVP 不包含
❌ 多用户系统
❌ 社交功能
❌ 复杂 AI 对话
❌ 移动端 App
❌ 3D 地形视图

#### 技术架构最终确定

**核心技术**:
- Next.js 15 (App Router) + React 19 + TypeScript
- Jotai (状态管理) + TanStack Query (数据获取)
- Tailwind CSS 4 + shadcn/ui + Radix UI + Framer Motion
- SQLite (开发) + Turso (生产) + Drizzle ORM
- tRPC + Zod (API 层)
- Mapbox GL JS + react-map-gl + turf.js
- Vercel AI SDK + OpenAI GPT-4o-mini

**项目结构**: 简化 Monorepo
- `src/app/` - Next.js 页面
- `src/components/` - React 组件
- `src/lib/` - 核心库（DB、tRPC、同步）
- `src/stores/` - Jotai 状态
- `scripts/` - 数据同步脚本

#### 开发时间线

| 周次 | 任务 | 关键产出 |
|------|------|----------|
| Week 1-2 | 数据层 | 数据库、同步系统、数据处理 |
| Week 3 | API 层 | tRPC 路由、服务层 |
| Week 3-4 | 前端基础 | 项目初始化、核心组件、状态管理 |
| Week 4-5 | 地图可视化 | 基础地图、配速可视化、路线回放 |
| Week 5-6 | 配速分析 | 配速图表、分段表、统计卡片 |
| Week 6-7 | AI 功能 | AI 服务集成、组件开发、优化 |
| Week 7-8 | 页面开发 | 首页、详情页、设置页、自动化 |

#### 验收标准
- 功能: 数据同步、地图展示、配速分析、AI 建议全部正常
- 性能: 首屏 < 3s、地图 > 30fps、API < 500ms
- 质量: 无 TS 错误、无 ESLint 警告、核心功能有测试

#### 关键设计决策

1. **使用 Jotai 而非 Zustand**: 三个参考项目均使用，更轻量
2. **SQLite + Turso**: 开发简单，生产分布式，成本低
3. **适配器模式**: 借鉴 Afilmory，支持多数据源扩展
4. **tRPC**: 类型安全，开发效率高
5. **Vercel AI SDK**: 流式响应，用户体验好

### 待完成任务

- [x] 分析三个参考项目的架构特点
- [x] 制定详细的 MVP 功能清单
- [x] 更新技术方案文档
- [ ] 开始项目脚手架搭建
- [ ] 实施 Week 1-2 数据层开发

---

## 技术选型待确认

### 需要讨论的问题

1. **AI 服务选择**: OpenAI vs Claude vs 本地模型
2. **数据库方案**: Turso vs PostgreSQL vs SQLite
3. **认证方案**: NextAuth.js vs Clerk vs 自研
4. **是否支持多用户**: 单用户 vs 多用户
5. **社交功能**: 是否纳入 MVP
6. **移动端**: Web only vs PWA vs Native App

---

## 项目文件清单

### 已创建文件

1. **TECHNICAL_SPECIFICATION.md** - 完整技术方案文档
   - 包含技术栈、功能设计、数据库设计
   - 项目结构、API 设计
   - 开发路线图、性能优化策略
   - 部署方案、安全考虑

2. **CONVERSATION_LOG.md** - 本对话记录文件
   - 记录所有讨论内容
   - 决策过程和理由
   - 待办事项列表

### 待创建文件

- [ ] MVP_PLAN.md - 详细的 MVP 实施计划
- [ ] ARCHITECTURE.md - 详细的架构设计文档
- [ ] API_DESIGN.md - API 接口设计文档
- [ ] DATABASE_SCHEMA.md - 数据库设计详情

---

## 下一步行动

1. **立即**: 分析参考项目架构
2. **然后**: 制定具体的 MVP 方案
3. **接着**: 讨论和确认技术细节
4. **最后**: 开始搭建项目脚手架

---

**对话状态**: 进行中
**当前阶段**: 技术方案讨论与优化
