# Animation Guidelines

Based on Apple WWDC 2023 "Animate with springs" and industry best practices.

## Core Principles

### 1. Purpose-Driven Animation

**Use animation when:**

- State changes (page transitions, expand/collapse)
- User action feedback (tap, drag response)
- Guiding attention (new data, important alerts)
- Spatial relationships (showing "where from/to")

**Avoid animation when:**

- Decorative looping animations
- Making users wait (loading spinners blocking content)
- Every element animating (overwhelming)
- Meaningless entrance animations

### 2. Spring Over Duration

Use spring animations instead of fixed-duration timing curves:

```tsx
// ❌ Avoid: Fixed duration
transition={{ duration: 0.4, ease: "easeOut" }}

// ✅ Prefer: Spring physics
transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}

// ✅ Even better: Framer Motion presets
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

Spring benefits:

- Velocity continuity (picks up from gesture end)
- Natural deceleration (no abrupt stops)
- Distance-adaptive (longer distance = more time, automatically)

### 3. Spring Presets

| Preset     | bounce  | Use Case                             |
| ---------- | ------- | ------------------------------------ |
| **smooth** | 0       | Subtle transitions, opacity changes  |
| **snappy** | 0.1-0.2 | UI interactions, button presses      |
| **bouncy** | 0.3-0.4 | Playful elements, attention-grabbing |

```tsx
// Smooth (no bounce) - for page transitions
const smooth = { type: 'spring', stiffness: 300, damping: 30 }

// Snappy (small bounce) - for interactions
const snappy = { type: 'spring', stiffness: 400, damping: 25 }

// Bouncy (larger bounce) - for emphasis
const bouncy = { type: 'spring', stiffness: 300, damping: 15 }
```

### 4. Don't Block Users

Content should be interactive ASAP:

```tsx
// ❌ Avoid: Staggered entrance blocking content
staggerChildren: 0.1  // 10 items = 1 second wait

// ✅ Prefer: Instant content, subtle fade
initial={{ opacity: 0.8 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}
```

### 5. Different End Times Are OK

Properties can finish at different times - this is natural:

```tsx
// ✅ Natural: position and opacity can end at different times
animate={{ x: 0, opacity: 1 }}
transition={{
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 }
}}
```

## Project-Specific Guidelines

### Page Transitions

Use `layoutId` for shared element transitions:

```tsx
// List page
<motion.div layoutId={`activity-${id}`}>
  <ActivityCard />
</motion.div>

// Detail page
<motion.div layoutId={`activity-${id}`}>
  <ActivityHeader />
</motion.div>
```

### Interaction Feedback

```tsx
// Card press feedback
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
```

### Scroll-Based Effects

For scroll shadows (like splits table):

```tsx
// Use CSS transitions for scroll-based effects, not Framer
className="transition-shadow duration-150"
style={{ boxShadow: isScrolled ? '0 -4px 12px rgba(0,0,0,0.1)' : 'none' }}
```

### Loading States

```tsx
// ❌ Avoid: Blocking spinner
<LoadingSpinner />

// ✅ Prefer: Skeleton with subtle pulse
<div className="animate-pulse bg-gray-200/50 rounded-xl" />

// ✅ Even better: Immediate content with fade-in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
>
  {content}
</motion.div>
```

### Chart Animations

One-time draw animation on first view:

```tsx
// Line chart path animation
<motion.path
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
/>
```

## Anti-Patterns

### ❌ Number Counting Animation

```tsx
// Don't do this - delays information
<AnimatedNumber from={0} to={42.1} duration={1000} />

// Just show the number
<span>42.1</span>
```

### ❌ Staggered List Entrance

```tsx
// Don't stagger many items
variants={{
  visible: { transition: { staggerChildren: 0.1 } }
}}

// Show all at once, or very fast stagger (< 0.03s)
variants={{
  visible: { transition: { staggerChildren: 0.02 } }
}}
```

### ❌ Decorative Loops

```tsx
// Don't add meaningless motion
animate={{ y: [0, -5, 0] }}
transition={{ repeat: Infinity, duration: 2 }}
```

## References

- [Apple WWDC 2023: Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/)
- [The Physics Behind Spring Animations](https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/)
- [animations.dev](https://animations.dev)
