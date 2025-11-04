# RunPaceFlow MVP 实施计划

**版本**: v1.0
**创建日期**: 2025-01-04
**预计周期**: 6-8 周

---

## 📋 MVP 目标

构建一个**最小可行产品**，专注于核心功能，快速验证产品理念。MVP 将支持：
- ✅ 单用户使用（个人跑步记录）
- ✅ 基础地图展示和路线回放
- ✅ 配速分析和可视化
- ✅ 简单的 AI 建议
- ✅ 数据自动同步（Strava + Garmin）

**不包含在 MVP 中**:
- ❌ 多用户系统
- ❌ 社交功能
- ❌ 复杂的 AI 对话
- ❌ 移动端 App
- ❌ 3D 地形视图

---

## 🎯 核心功能清单

### 1. 数据层 (Week 1-2)

#### 1.1 数据库设计 ⏱️ 3天
- [x] 设计核心表结构
  - `activities` 表（活动记录）
  - `splits` 表（分段数据）
  - `user_profile` 表（用户配置）
- [ ] 使用 Drizzle ORM 定义 schema
- [ ] 实现数据库迁移脚本
- [ ] 编写数据验证和类型定义

**技术选择**: SQLite (开发) + Turso (生产)

#### 1.2 数据同步系统 ⏱️ 4天
- [ ] 实现 Strava 数据同步
  - OAuth 认证流程
  - 活动列表获取
  - GPX 数据下载
- [ ] 实现 Garmin 数据同步
  - 账号密码认证
  - 活动数据获取
- [ ] GPX 文件解析器
  - 坐标点提取
  - 配速计算
  - 海拔数据处理
- [ ] 增量同步机制
  - 上次同步时间记录
  - 只同步新活动

**参考**: Afilmory 的适配器模式

#### 1.3 数据处理服务 ⏱️ 3天
- [ ] 配速计算服务
  - 每公里配速
  - 平均配速
  - 最快配速
- [ ] 分段数据生成
  - 按公里拆分
  - 统计信息汇总
- [ ] 数据缓存策略

---

### 2. API 层 (Week 2-3)

#### 2.1 tRPC 路由设计 ⏱️ 3天
```typescript
// 活动相关
activity.list           // 获取活动列表（分页）
activity.getById        // 获取单个活动详情
activity.getStats       // 获取活动统计数据

// 同步相关
sync.trigger            // 触发数据同步
sync.status             // 获取同步状态

// 用户相关
user.getProfile         // 获取用户信息
user.updateProfile      // 更新用户信息
```

- [ ] 实现 tRPC 路由
- [ ] 添加输入验证（Zod）
- [ ] 错误处理中间件
- [ ] API 响应缓存

**参考**: cyc-earth 的 tRPC 实践

#### 2.2 服务层设计 ⏱️ 2天
- [ ] ActivityService（活动业务逻辑）
- [ ] SyncService（同步业务逻辑）
- [ ] StatsService（统计业务逻辑）

---

### 3. 前端基础 (Week 3-4)

#### 3.1 项目初始化 ⏱️ 2天
- [ ] 使用 `create-next-app` 创建项目
- [ ] 配置 TypeScript
- [ ] 配置 Tailwind CSS
- [ ] 集成 shadcn/ui
- [ ] 配置 ESLint + Prettier
- [ ] 设置环境变量

#### 3.2 核心组件开发 ⏱️ 5天

**布局组件**:
- [ ] `AppLayout` - 应用主布局
- [ ] `Header` - 顶部导航栏
- [ ] `Sidebar` - 侧边栏（可选）
- [ ] `Footer` - 底部信息

**UI 组件（shadcn/ui）**:
- [ ] Button, Card, Dialog
- [ ] Select, Input, Label
- [ ] Tabs, Table
- [ ] Loading, Toast

**业务组件**:
- [ ] `ActivityCard` - 活动卡片
- [ ] `StatsCard` - 统计卡片
- [ ] `SyncButton` - 同步按钮

#### 3.3 状态管理 ⏱️ 2天
- [ ] 使用 Jotai 管理全局状态
- [ ] 定义核心 atoms
  ```typescript
  // UI 状态
  uiAtom             // 侧边栏、主题等

  // 用户状态
  userAtom           // 用户信息

  // 数据状态
  selectedActivityAtom  // 当前选中的活动
  ```

**参考**: Shiro 的 Jotai 实践

---

### 4. 地图可视化 (Week 4-5)

#### 4.1 基础地图组件 ⏱️ 3天
- [ ] 集成 Mapbox GL JS
- [ ] 创建 `RunMap` 组件
  - 地图初始化
  - 样式配置
  - 控制按钮
- [ ] 路线绘制
  - 解析 GPX 坐标
  - 绘制 LineString
  - 自动缩放到合适区域

#### 4.2 配速可视化 ⏱️ 4天
- [ ] 配速颜色映射
  ```typescript
  // 配速 → 颜色渐变
  快速 (< 平均 - 30s) → 绿色 #10b981
  正常 (平均 ± 30s)   → 黄色 #eab308
  慢速 (> 平均 + 30s) → 红色 #ef4444
  ```
- [ ] 每公里标记点
  - 在路线上添加标记
  - 显示公里数
  - 点击显示该公里详情
- [ ] Popup 信息窗口
  - 配速、用时、海拔

#### 4.3 路线回放 ⏱️ 3天
- [ ] 创建 `RoutePlayer` 组件
  - 播放/暂停按钮
  - 进度条
  - 速度控制（0.5x, 1x, 2x, 5x）
- [ ] 动画实现
  - 使用 `requestAnimationFrame`
  - 平滑移动动画
  - 实时显示当前位置数据
- [ ] 相机跟随
  - 地图自动跟随当前位置

**参考**: Afilmory 的高性能渲染技术

---

### 5. 配速分析 (Week 5-6)

#### 5.1 配速图表 ⏱️ 3天
- [ ] 选择图表库（推荐 Recharts 或 Chart.js）
- [ ] 创建 `PaceChart` 组件
  - 每公里配速折线图
  - 平均配速参考线
  - 最快配速标记
  - 悬停显示详情
- [ ] 图表交互
  - 缩放
  - 拖拽
  - 点击跳转到地图位置

#### 5.2 分段数据表 ⏱️ 2天
- [ ] 创建 `SplitsTable` 组件
  ```
  公里 | 用时   | 配速  | 差异   | 海拔  | 心率
  1km  | 5:30  | 5:30 | -0:20 ↓| +10m | 145
  2km  | 5:45  | 5:45 | -0:05 ↓| +5m  | 150
  ```
- [ ] 表格排序
- [ ] 高亮最快/最慢分段

#### 5.3 统计卡片 ⏱️ 2天
- [ ] 创建 `ActivityStats` 组件
  - 总距离、总时间
  - 平均配速、最快配速
  - 海拔爬升
  - 平均心率（如有）
- [ ] 响应式布局
- [ ] 动画效果

---

### 6. AI 建议 (Week 6-7)

#### 6.1 AI 服务集成 ⏱️ 2天
- [ ] 集成 Vercel AI SDK
- [ ] 选择 AI 模型（推荐 GPT-4o-mini）
- [ ] 创建 AI prompt 模板
  ```typescript
  // 训练建议 prompt
  分析用户最近的跑步数据，提供：
  1. 训练负荷评估
  2. 配速一致性分析
  3. 下次训练建议
  ```
- [ ] 实现 API 端点

#### 6.2 AI 组件开发 ⏱️ 3天
- [ ] 创建 `AIInsights` 组件
  - Loading 状态
  - 流式输出显示
  - Markdown 渲染
- [ ] 创建 `TrainingAdvice` 组件
  - 建议列表
  - 严重程度标记
- [ ] 错误处理
  - API 失败重试
  - 友好错误提示

#### 6.3 AI 功能优化 ⏱️ 2天
- [ ] 缓存 AI 响应（24小时）
- [ ] 限流（防止频繁调用）
- [ ] 成本控制
  - 使用更便宜的模型
  - 限制输入长度

**参考**: 使用 Vercel AI SDK 的流式响应

---

### 7. 页面开发 (Week 7-8)

#### 7.1 首页 - 总览 ⏱️ 3天
```
/
├── Header（导航栏）
├── StatsCards（统计卡片）
│   ├── 总里程
│   ├── 本周跑量
│   └── 本月跑量
├── Map（总览地图 - 显示所有路线）
└── ActivityList（最近活动列表）
```

- [ ] 实现页面布局
- [ ] 集成数据获取（tRPC）
- [ ] 添加骨架屏
- [ ] 响应式适配

#### 7.2 活动详情页 ⏱️ 4天
```
/activity/[id]
├── ActivityHeader（标题、时间、操作）
├── ActivityStats（关键数据）
├── Tabs
│   ├── Overview（总览）
│   │   ├── Map（带回放的地图）
│   │   └── PaceChart（配速图表）
│   ├── Splits（分段数据表）
│   └── AI Insights（AI 建议）
└── RelatedActivities（相似活动）
```

- [ ] 实现页面布局
- [ ] 地图和回放集成
- [ ] 配速图表集成
- [ ] AI 建议集成
- [ ] 响应式适配

#### 7.3 设置页面 ⏱️ 2天
```
/settings
├── Profile（个人信息）
├── Connections（连接平台）
│   ├── Strava 连接状态
│   └── Garmin 连接状态
├── Sync（同步设置）
└── Preferences（偏好设置）
```

- [ ] 实现表单组件
- [ ] OAuth 流程
- [ ] 同步触发功能

---

### 8. 数据同步自动化 (Week 8)

#### 8.1 GitHub Actions 配置 ⏱️ 2天
```yaml
name: Sync Running Data

on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时运行一次
  workflow_dispatch:        # 手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
      - name: Setup Node.js
      - name: Install dependencies
      - name: Run sync script
      - name: Commit and push
```

- [ ] 创建 workflow 文件
- [ ] 配置环境变量
- [ ] 测试自动同步

**参考**: running_page 的自动化流程

#### 8.2 Webhook 支持 ⏱️ 2天
- [ ] Strava Webhook
  - 订阅事件
  - 验证请求
  - 触发同步
- [ ] 错误通知
  - 邮件提醒
  - Discord 通知

---

## 🏗️ 技术架构（最终确定）

### 核心技术栈

```typescript
// 前端框架
Next.js 15          // App Router
React 19            // 最新特性
TypeScript          // 类型安全

// UI 框架
Tailwind CSS 4      // 样式
shadcn/ui           // 组件库
Radix UI            // 无障碍基础
Framer Motion       // 动画

// 状态管理
Jotai               // 原子化状态
TanStack Query      // 数据获取

// 数据库
SQLite (开发)       // 本地开发
Turso (生产)        // 分布式 SQLite
Drizzle ORM         // 类型安全 ORM

// API 层
tRPC                // 类型安全 API
Zod                 // 数据验证

// 地图
Mapbox GL JS        // 地图渲染
react-map-gl        // React 封装
turf.js             // 地理计算

// AI
Vercel AI SDK       // AI 集成
OpenAI API          // GPT-4o-mini

// 开发工具
pnpm                // 包管理
ESLint + Prettier   // 代码质量
Vitest              // 单元测试
```

### 项目结构

```
runPaceFlow/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (main)/              # 主应用
│   │   │   ├── page.tsx         # 首页
│   │   │   ├── activity/[id]/   # 活动详情
│   │   │   └── settings/        # 设置
│   │   ├── api/                 # API Routes
│   │   │   └── trpc/[trpc]/     # tRPC 端点
│   │   └── layout.tsx
│   │
│   ├── components/              # 组件
│   │   ├── ui/                 # shadcn/ui
│   │   ├── map/                # 地图组件
│   │   ├── activity/           # 活动组件
│   │   ├── ai/                 # AI 组件
│   │   └── layout/             # 布局组件
│   │
│   ├── lib/                    # 工具库
│   │   ├── db/                # 数据库
│   │   ├── trpc/              # tRPC 配置
│   │   ├── sync/              # 同步逻辑
│   │   └── utils/             # 工具函数
│   │
│   ├── stores/                 # Jotai stores
│   ├── hooks/                  # 自定义 hooks
│   ├── types/                  # 类型定义
│   └── styles/                 # 全局样式
│
├── scripts/                    # 脚本
│   └── sync/                  # 数据同步脚本
│
├── public/                     # 静态资源
├── drizzle/                    # 数据库迁移
└── .github/workflows/          # CI/CD
```

---

## 📊 开发时间线

### Week 1-2: 数据层
- ✅ 数据库设计
- ✅ 同步系统
- ✅ 数据处理

### Week 3: API 层
- ✅ tRPC 路由
- ✅ 服务层

### Week 3-4: 前端基础
- ✅ 项目初始化
- ✅ 核心组件
- ✅ 状态管理

### Week 4-5: 地图可视化
- ✅ 基础地图
- ✅ 配速可视化
- ✅ 路线回放

### Week 5-6: 配速分析
- ✅ 配速图表
- ✅ 分段数据表
- ✅ 统计卡片

### Week 6-7: AI 功能
- ✅ AI 服务集成
- ✅ AI 组件开发
- ✅ 功能优化

### Week 7-8: 页面开发
- ✅ 首页
- ✅ 活动详情页
- ✅ 设置页面
- ✅ 自动化同步

---

## ✅ 验收标准

### 功能验收
- [ ] 用户可以成功同步 Strava/Garmin 数据
- [ ] 首页正确显示所有活动和统计数据
- [ ] 地图正确显示跑步路线
- [ ] 路线回放功能正常工作
- [ ] 配速图表准确显示每公里配速
- [ ] 分段数据表正确显示
- [ ] AI 建议功能正常工作
- [ ] 响应式设计在移动端正常显示

### 性能验收
- [ ] 首屏加载时间 < 3s
- [ ] 地图渲染流畅（> 30fps）
- [ ] API 响应时间 < 500ms
- [ ] 支持 100+ 活动无性能问题

### 代码质量
- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 核心功能有单元测试
- [ ] 代码注释完整

---

## 🚀 部署计划

### 开发环境
```bash
# 本地开发
pnpm dev

# 数据库
使用 SQLite
```

### 生产环境
```bash
# 部署到 Vercel
vercel deploy

# 数据库
使用 Turso（自动创建）
```

### 环境变量
```env
# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# AI
OPENAI_API_KEY=

# Strava
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REFRESH_TOKEN=

# Garmin
GARMIN_EMAIL=
GARMIN_PASSWORD=

# Database
DATABASE_URL=
```

---

## 🔄 后续迭代计划

### Phase 2 (MVP 之后)
- 多用户支持
- 用户认证系统
- 数据隐私设置
- 更丰富的 AI 功能
- 社交功能基础

### Phase 3 (长期)
- 移动端 PWA
- 训练计划功能
- 比赛记录
- 装备管理
- 社区功能

---

## 📝 风险与挑战

### 技术风险
1. **地图性能**: 大量路线渲染可能卡顿
   - 解决: 使用聚合、简化坐标点

2. **AI 成本**: OpenAI API 调用成本
   - 解决: 使用缓存、限流、便宜模型

3. **数据同步失败**: API 变更或限流
   - 解决: 错误重试、降级策略

### 时间风险
- MVP 时间紧凑，需要严格控制范围
- 每个阶段留出 buffer 时间
- 优先实现核心功能

### 质量风险
- 快速开发可能影响代码质量
- 解决: 每周代码审查、重点功能测试

---

## 💡 成功关键因素

1. **专注核心**: 严格控制 MVP 范围，不做额外功能
2. **快速迭代**: 每周完成一个模块，及时调整
3. **参考最佳实践**: 借鉴 Afilmory、Shiro、Follow 的经验
4. **用户验证**: 尽早让真实用户使用，收集反馈
5. **性能优先**: 从一开始就关注性能指标

---

**下一步**: 开始 Week 1-2 的数据层开发！ 🚀
