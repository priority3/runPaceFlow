# RunPaceFlow UI 规范（Glass + Mint + 灰阶）

> 目标：让 UI 从“模块拼装”变成“同一个系统里长出来的仪表盘”。  
> 风格：Apple Fitness / iOS 原生质感的 **玻璃拟态仪表盘**。  
> 约束：**单主色（mint）+ iOS 灰阶**；不引入额外 WebFont（使用系统字体栈）。

---

## 1. 一句话定位（产品语言）

RunPaceFlow 是一个 Apple Fitness 风格的跑步仪表盘：暗色氛围底 + Glass 面板承载信息；地图是舞台背景，数字是主角。全站唯一强调色 **mint** 贯穿选中态、交互态、图表与路线高亮，其余全部使用 iOS 灰阶。

---

## 2. 设计原则（防碎片化）

1. **只有两种 Surface**：Base（背景）与 Glass（信息层）。禁止出现第三种卡片风格。
2. **数字优先**：指标数字的字号/字重/行高/对齐必须全站一致。
3. **单主色**：mint 只用于 selection / interaction / visualization / progress。
4. **同一状态驱动一切**：时间范围与选中活动必须全局联动（地图、列表、指标同时响应）。
5. **动效少而准**：两档时长即可；避免夸张动效和“到处发光”。

---

## 3. 颜色系统（Single Accent + Grayscale）

### 3.1 灰阶（来自 UIKit Tokens）

项目已使用 `tailwindcss-uikit-colors`，灰阶直接使用以下语义 token（不再自造）：

- 文本：`text-label` / `text-secondary-label` / `text-tertiary-label`
- 背景：`bg-system-background` / `bg-secondary-system-background`
- 分隔：`border-separator`
- 填充（hover/chip）：`bg-secondary-fill` / `bg-tertiary-fill`

> 规则：能用 `separator` 分隔就不要用重阴影；能用灰阶表达就不要引入第二强调色。

### 3.2 主强调色：mint（唯一）

mint 只允许出现于：

1. **Selection**：segmented/tab/列表当前行/已选路线
2. **Interaction**：focus ring、hover 边框、主要按钮强调
3. **Visualization**：图表主线、地图高亮路线
4. **Progress**：目标达成/进度提醒（尽量使用“soft mint”，不做高饱和大片铺色）

禁止项：

- 不允许把“距离/配速/心率”等指标各自染色（会立刻碎片化）。
- “发光效果”只允许用于选中路线/选中行，且强度极低（更像系统 highlight）。

---

## 4. 字体策略（不引入 WebFont）

### 4.1 字体栈

- 使用系统字体栈（iOS/macOS 优先 SF，Windows/Android 自动 fallback）。
- 中文由系统字体接管（苹方/微软雅黑等），避免中英文混排割裂。

### 4.2 数字排版（必须全站统一）

所有指标数字、表格数字列必须启用：

- `tabular-nums`（数字等宽，列表/表格不跳）
- `tracking-tight`（更像仪表盘读数）
- `leading-none` 或接近 `1.05` 的紧凑行高

单位与标签统一：

- 单位：小号、低对比（例如 `text-tertiary-label text-xs font-medium`）
- 标签：次级对比（例如 `text-secondary-label text-sm font-medium`）

---

## 5. Typography Scale（全站仅三档层级）

> 规则：不要在不同模块里随意发明字号/字重；只允许使用这三档。

### 5.1 Title（标题）

- 页面标题 / 主模块标题
- 建议：`text-xl font-semibold text-label`

### 5.2 Metric（指标）

- Hero 数字 / 卡片关键读数
- 建议：`tabular-nums tracking-tight leading-none font-semibold text-label`
- 大小建议：
  - Hero：`text-3xl` 或 `text-4xl`（仅首页核心指标）
  - 常规模块：`text-2xl`

### 5.3 Label（标签/说明）

- 单位 / 说明 / 表头
- 建议：`text-xs font-medium text-tertiary-label`

---

## 6. Surface（材质）规则

### 6.1 Base（背景层）

- 深色底 + 轻微渐变作为氛围（强度要克制）
- 地图属于背景舞台：整体降饱和/降对比，不抢主指标

### 6.2 Glass（信息层）

Glass 面板必须统一：

- 半透明底（灰阶）
- 轻微 blur（backdrop）
- 细边框（separator）
- 统一圆角：建议 `16px`（全站只用一个大圆角）
- 统一内边距：建议 16/20/24 三档

禁止项：

- 禁止重阴影卡片（玻璃质感靠边框与高光，不靠大投影）。
- 禁止出现多种圆角体系（会瞬间变“拼装风”）。

---

## 7. 布局骨架（Dashboard Layout）

推荐总览页结构（桌面/移动均适配）：

1. **Top Bar**
   - Large Title（例如 Running / Overview）
   - Segmented Control（Week / Month / Year 或 Year Tabs）
2. **Hero**
   - Summary（Glass）：距离/次数/配速/心率/连续天数等核心指标
   - Stage（Base 或 Glass）：地图/路线（舞台）
3. **Feed**
   - Activity List（Glass）：活动列表（可选中）
4. **Detail**
   - Bottom Sheet / Side Panel：详情（路线、splits、心率、AI insight）

核心原则：

- “范围切换”是唯一全局入口；所有模块只响应它，不各自维护筛选。
- 页面主线只有一条：先看 Summary，再看 Stage，再下钻 Detail。

---

## 8. 状态联动（cool 的关键）

最少需要三个跨模块状态（概念即可，具体实现方式不限）：

- `range`：时间范围（week/month/year 或 year）
- `selectedActivityId`：选中活动
- `hoverActivityId`：hover 活动（桌面端增强）

联动规则（建议强制落实）：

1. hover 列表行 → 地图高亮路线（mint）+ tooltip 展示关键指标
2. hover 地图路线 → 列表行高亮（mint 左侧条/边框）
3. click 任意一边 → 锁定 selection → 打开 detail sheet（统一动效）
4. 切换 range/year → summary、map、list **同步更新 + 同步过渡**

选中态视觉统一（不要各模块自创样式）：

- mint 边框 / 左侧条 / 轻 glow（强度很低）
- 文字不必染色，尽量保持灰阶；用边框/环/线条表达选中

---

## 9. 动效（Motion）

> 原则：少而准，两档时长全站统一。

时长建议：

- Hover / micro interaction：`180ms`
- 页面切换 / sheet 开关 / range 切换：`280ms`

动效形式建议：

- Glass 面板：`fade + translateY(4px)`（很轻）
- 指标更新：`crossfade`（或轻量数字滚动，后续再做）
- 路线高亮：线宽/透明度过渡（避免复杂粒子特效）

---

## 10. 执行清单（每加一个模块都要过一遍）

- 是否只使用 Base / Glass 两类容器？
- 指标数字是否统一使用 Metric 规则（`tabular-nums`、紧凑行高、单位低对比）？
- 交互态是否只使用 mint？
- 是否出现第二强调色或“彩虹指标”？
- range/selection 是否全局联动？
- hover/click 是否地图与列表互相响应？
- 动效时长是否只使用两档（180/280）？

---

## 11. 建议的组件抽象（工程落地）

为避免“每个页面手写一套”，建议优先抽两个基础组件：

1. `GlassPanel`
   - 统一：圆角 / 边框 / blur / padding / hover 样式
2. `Metric`
   - 统一：数字样式（tabular-nums + tight）/ 单位 / label 的 baseline 对齐

> 后续所有页面优先组合这些基础组件，而不是复制粘贴 className。
