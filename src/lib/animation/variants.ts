/**
 * Framer Motion Animation Variants
 *
 * Centralized animation configurations following Apple HIG principles
 */

import type { Variants } from 'framer-motion'

/**
 * Easing functions for custom animations
 */
export const easings = {
  // Apple's signature easing
  easeOutExpo: [0.16, 1, 0.3, 1],
  // Gentle ease for most UI
  easeInOut: [0.4, 0, 0.2, 1],
  // Snappy response
  easeOut: [0, 0, 0.2, 1],
  // Smooth deceleration
  decelerate: [0, 0.55, 0.45, 1],
}

/**
 * Spring configurations for different interaction types
 */
export const springs = {
  // Gentle spring for most UI interactions
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  // Snappy spring for immediate feedback
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  // Smooth spring for page transitions
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 35,
  },
  // Bouncy spring for playful interactions
  bouncy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  },
}

/**
 * Duration presets for tween animations
 */
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
}

/**
 * Fade animation variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

/**
 * Slide up animation variants
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
}

/**
 * Scale animation variants (for cards and buttons)
 */
export const scaleVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: springs.snappy,
  },
}

/**
 * Card animation variants with subtle interactions
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: springs.gentle,
  },
  tap: {
    scale: 0.99,
    transition: springs.snappy,
  },
}

/**
 * Stagger container for list animations
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

/**
 * Stagger item variants
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
}

/**
 * Number counter animation variants
 */
export const numberCounterVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
}

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
}

/**
 * Button press variants with haptic-like feedback
 */
export const buttonVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.95,
    transition: springs.snappy,
  },
}

/**
 * Shimmer loading effect variants
 */
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

/**
 * Drawer/Modal animation variants
 */
export const drawerVariants: Variants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.25 },
  },
}

/**
 * Toast notification variants
 */
export const toastVariants: Variants = {
  hidden: {
    y: -100,
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    y: -100,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
}

/**
 * Pulse animation for loading states
 */
export const pulseVariants: Variants = {
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: 0.5,
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
}

/**
 * Slide in from directions
 */
export const slideInFromLeft: Variants = {
  hidden: {
    x: -100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
}

export const slideInFromRight: Variants = {
  hidden: {
    x: 100,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
}

export const slideInFromBottom: Variants = {
  hidden: {
    y: 100,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: springs.smooth,
  },
}

/**
 * Helper function to create reduced motion variants
 * Respects user's accessibility preferences
 */
export function getAccessibleVariants(variants: Variants, prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    // Return simplified variants with only opacity changes
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    }
  }
  return variants
}

/**
 * Helper function to create stagger timing
 */
export function getStaggerDelay(index: number, baseDelay = 0, increment = 0.05): number {
  return baseDelay + index * increment
}
