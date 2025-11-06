# RunPaceFlow 动画优化方案

## 📋 优化概览

本文档详细规划了 RunPaceFlow 项目的交互和动画优化策略，基于 Framer Motion 和 Apple HIG 设计原则。

---

## 🎯 优化目标

1. **一致性** - 统一的动画语言和交互模式
2. **流畅性** - 60fps 的流畅动画，避免卡顿
3. **响应性** - 快速的交互反馈，提升感知性能
4. **愉悦性** - 适度的微交互，提升用户体验
5. **可访问性** - 尊重用户的动画偏好设置

---

## 📊 优先级分级

### P0 - 立即实施（核心交互改进）

#### 1.1 ActivityCard 组件升级
**当前问题**：
- 只有 CSS hover 效果
- 没有点击反馈动画
- 缺少入场动画

**优化方案**：
```typescript
// 使用 cardVariants + buttonVariants
// 添加 hover、tap、fadeIn 动画
// 优化 Play 按钮的交互反馈
```

**影响范围**：首页活动卡片、活动详情页

#### 1.2 HomePage StatCard 升级
**当前问题**：
- 使用简单的 div，没有动画
- 错过了展示数字增长的机会

**优化方案**：
```typescript
// 替换为 StatsCard 组件
// 添加 stagger 延迟，按顺序入场
// 数字从 0 递增到目标值
```

**影响范围**：首页统计卡片

#### 1.3 页面路由过渡
**当前问题**：
- 页面切换生硬，没有过渡效果
- PageTransition 组件未被使用

**优化方案**：
```typescript
// 在 layout.tsx 中包裹 PageTransition
// 使用 AnimatePresence 处理退出动画
// 路由参数变化时触发过渡
```

**影响范围**：全局路由切换

---

### P1 - 短期优化（增强现有交互）

#### 2.1 列表动画增强
**当前问题**：
- ActivityTable 已有 stagger，但可以更精致
- 删除/更新动画需要优化

**优化方案**：
```typescript
// 使用 layout 动画处理位置变化
// 添加 exit 动画处理删除
// 优化 hover 状态的视觉层次
```

#### 2.2 加载状态优化
**当前问题**：
- 使用简单的 `animate-pulse`
- skeleton 与实际内容不匹配

**优化方案**：
```typescript
// 创建 Skeleton 组件，匹配实际布局
// 使用 shimmer 动画替代 pulse
// 添加渐进式加载效果
```

#### 2.3 地图交互增强
**当前问题**：
- 地图加载没有过渡
- 路线出现较突兀

**优化方案**：
```typescript
// 添加地图容器的淡入动画
// 路线绘制动画（pathLength）
// 标记点的 stagger 入场
```

---

### P2 - 中期优化（添加新交互模式）

#### 3.1 手势交互系统
**功能**：
- 卡片拖拽排序
- 侧滑显示操作菜单
- 下拉刷新

**技术方案**：
```typescript
// useDragControls() - 拖拽控制
// useMotionValue() + useTransform() - 手势跟踪
// spring 物理引擎 - 回弹效果
```

#### 3.2 通知系统
**功能**：
- Toast 通知
- 成功/错误/警告状态
- 自动消失 + 手动关闭

**技术方案**：
```typescript
// 使用 AnimatePresence + toastVariants
// Jotai atom 管理通知队列
// Portal 渲染到 body
```

#### 3.3 模态对话框
**功能**：
- 活动详情快速预览
- 数据同步确认
- 设置面板

**技术方案**：
```typescript
// Radix Dialog + drawerVariants
// Backdrop blur + fade
// 内容区域 slide + scale
```

---

### P3 - 长期优化（高级交互特性）

#### 4.1 共享元素过渡
**功能**：
- 卡片 → 详情页的元素共享
- 地图缩放过渡
- 图表展开动画

**技术方案**：
```typescript
// layoutId 跨组件动画
// AnimatePresence 协调
// Shared layout animations
```

#### 4.2 视差滚动效果
**功能**：
- 首页 header 的视差
- 活动详情的背景视差
- 深度层次感

**技术方案**：
```typescript
// useScroll() + useTransform()
// useSpring() 平滑滚动
// 分层动画速度差异
```

#### 4.3 数据可视化动画
**功能**：
- 配速图表的绘制动画
- 分段数据的渐进显示
- 统计数据的对比动画

**技术方案**：
```typescript
// Recharts + Framer Motion
// SVG path animation
// Number morphing
```

---

## 🛠️ 技术实施指南

### 动画性能优化

#### 使用 GPU 加速属性
```typescript
// ✅ 推荐：transform 和 opacity
animate={{ opacity: 1, scale: 1.05, x: 10 }}

// ❌ 避免：layout 属性（width, height, top, left）
animate={{ width: 200, top: 100 }}
```

#### Layout Animations
```typescript
// 自动处理位置/尺寸变化
<motion.div layout>
  {/* 内容 */}
</motion.div>

// 独立控制不同属性
<motion.div
  layout="position"  // 只动画位置
  layout="size"      // 只动画尺寸
>
```

#### Will-change 优化
```typescript
// 提前告知浏览器优化
<motion.div
  style={{ willChange: 'transform' }}
  whileHover={{ scale: 1.05 }}
>
```

### 可访问性考虑

#### 尊重用户偏好
```typescript
// 检测用户的动画偏好
const prefersReducedMotion = useReducedMotion()

<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
>
```

#### 焦点管理
```typescript
// 动画完成后恢复焦点
<motion.div
  onAnimationComplete={() => {
    elementRef.current?.focus()
  }}
>
```

### 动画调试

#### Framer Motion DevTools
```bash
# 安装
bun add -D framer-motion-devtools

# 使用
import { MotionConfig } from 'framer-motion'

<MotionConfig features={[Motion3D, MotionGesturePlugin]}>
  <App />
</MotionConfig>
```

---

## 📦 新增工具函数

### 1. useAnimation Hook
```typescript
// src/hooks/use-animation.ts
/**
 * 统一的动画控制 hook
 * 集中管理动画状态和控制
 */
export function useAnimation(options?: AnimationOptions) {
  const controls = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()

  return {
    controls,
    shouldAnimate: !prefersReducedMotion,
    // ...更多工具方法
  }
}
```

### 2. Gesture Utils
```typescript
// src/lib/animation/gestures.ts
/**
 * 手势交互工具
 * 处理拖拽、滑动、缩放等手势
 */
export const swipeConfidenceThreshold = 10000
export const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity
}
```

### 3. Animation Presets
```typescript
// src/lib/animation/presets.ts
/**
 * 预设动画配置
 * 快速应用常见动画模式
 */
export const presets = {
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  scaleIn: { initial: { scale: 0 }, animate: { scale: 1 } },
  slideInLeft: { initial: { x: -100 }, animate: { x: 0 } },
  // ...更多预设
}
```

---

## 🎨 新增组件

### 1. Skeleton 组件
```typescript
// src/components/ui/skeleton.tsx
/**
 * 加载骨架屏组件
 * 使用 shimmer 动画，匹配实际内容布局
 */
export function Skeleton({ className, variant = 'default' }) {
  return (
    <motion.div
      className={cn('bg-fill relative overflow-hidden rounded-xl', className)}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
    >
      <div className="bg-gradient-shimmer absolute inset-0" />
    </motion.div>
  )
}
```

### 2. Toast 组件
```typescript
// src/components/ui/toast.tsx
/**
 * Toast 通知组件
 * 支持多种状态和自动消失
 */
export function Toast({ message, type, duration = 3000 }) {
  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('rounded-2xl px-6 py-4 shadow-lg', {
        'bg-green/90': type === 'success',
        'bg-red/90': type === 'error',
        'bg-blue/90': type === 'info',
      })}
    >
      {message}
    </motion.div>
  )
}
```

### 3. AnimatedList 组件
```typescript
// src/components/ui/animated-list.tsx
/**
 * 通用动画列表组件
 * 自动处理 stagger、layout、exit 动画
 */
export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
}: AnimatedListProps<T>) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            variants={staggerItemVariants}
            layout
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
```

---

## 📈 实施时间表

### 第一周（P0）
- Day 1-2: ActivityCard 升级 + HomePage StatCard
- Day 3-4: 页面路由过渡系统
- Day 5: 测试和优化

### 第二周（P1）
- Day 1-2: 列表动画增强
- Day 3-4: 加载状态 + Skeleton
- Day 5: 地图交互优化

### 第三周（P2）
- Day 1-2: 手势交互系统
- Day 3-4: Toast 通知系统
- Day 5: 模态对话框

### 后续（P3）
- 根据用户反馈和实际需求
- 逐步添加高级特性
- 持续优化性能

---

## ✅ 验收标准

### 性能指标
- [ ] 动画帧率稳定在 60fps
- [ ] 首次交互延迟 < 100ms
- [ ] 页面过渡时长 < 300ms
- [ ] 无明显的布局抖动

### 用户体验
- [ ] 所有交互都有视觉反馈
- [ ] 动画不影响内容可读性
- [ ] 符合无障碍访问标准
- [ ] 支持 prefers-reduced-motion

### 代码质量
- [ ] 所有动画使用 variants 定义
- [ ] 性能敏感区域使用 transform/opacity
- [ ] 组件可复用，配置灵活
- [ ] TypeScript 类型完整

---

## 📚 参考资源

### 官方文档
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Apple HIG - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Material Design - Motion](https://m3.material.io/styles/motion/overview)

### 灵感来源
- [cyc.earth](https://cyc.earth) - 现代运动数据可视化
- [Linear](https://linear.app) - 流畅的应用交互
- [Stripe](https://stripe.com) - 精致的微交互

### 工具
- [Easings.net](https://easings.net) - 缓动函数速查
- [Cubic Bezier](https://cubic-bezier.com) - 贝塞尔曲线调试
- [Motion DevTools](https://www.framer.com/motion/devtools/) - 动画调试工具

---

## 🎯 下一步行动

1. **Review** - 团队审阅本方案，确定优先级
2. **Setup** - 配置开发环境和工具
3. **Implement** - 按 P0 → P1 → P2 顺序实施
4. **Test** - 性能测试和用户测试
5. **Iterate** - 根据反馈持续优化
