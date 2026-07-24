/**
 * Framer Motion variants — thin wrappers over shared spring presets.
 */

import type { Variants } from 'framer-motion'

import { springs } from './config'

export { springs } from './config'

export const easings = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  decelerate: [0, 0.55, 0.45, 1] as const,
}

export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
}

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.15 },
  },
}

export const scaleVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.microRebound,
  },
  tap: {
    scale: 0.95,
    transition: springs.microRebound,
  },
}

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.smooth,
  },
  hover: {
    y: -2,
    transition: springs.soft,
  },
  tap: {
    scale: 0.99,
    transition: springs.microRebound,
  },
}

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
}

export const numberCounterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
}

export const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
}

export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.microRebound,
  },
  tap: {
    scale: 0.95,
    transition: springs.microRebound,
  },
}

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

export const toastVariants: Variants = {
  hidden: { y: -80, opacity: 0, scale: 0.96 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    y: -80,
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
}

/** Accessibility: opacity-only when user prefers reduced motion. */
export function getAccessibleVariants(variants: Variants, prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    }
  }
  return variants
}

export function getStaggerDelay(index: number, baseDelay = 0, increment = 0.03): number {
  return baseDelay + index * increment
}
