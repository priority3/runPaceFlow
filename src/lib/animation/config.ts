/**
 * Animation configuration — Shiro-style perceptual springs.
 *
 * Prefer duration + bounce for UI motion; keep stiffness/damping
 * only for micro interaction rebound (press feedback).
 */

import type { Transition } from 'framer-motion'

/** Perceptual spring presets (duration + bounce), inspired by Shiro. */
export const springs = {
  /** No bounce — panels, page content, soft fades */
  smooth: {
    type: 'spring' as const,
    duration: 0.4,
    bounce: 0,
  },
  /** Small bounce — tabs, chips, snappy UI */
  snappy: {
    type: 'spring' as const,
    duration: 0.4,
    bounce: 0.15,
  },
  /** Higher bounce — emphasis / playful moments */
  bouncy: {
    type: 'spring' as const,
    duration: 0.4,
    bounce: 0.3,
  },
  /** Press / hover micro feedback */
  microRebound: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
  /** Soft panel settle */
  soft: {
    type: 'spring' as const,
    duration: 0.35,
    stiffness: 120,
    damping: 20,
  },
  /** Alias used by older call sites */
  quick: {
    type: 'spring' as const,
    duration: 0.28,
    bounce: 0.05,
  },
  /** Alias: gentle ≈ smooth */
  gentle: {
    type: 'spring' as const,
    duration: 0.4,
    bounce: 0,
  },
} satisfies Record<string, Transition>

/** Shared pressable interaction (Shiro MotionButton). */
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.95 },
  transition: springs.microRebound,
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
}

/** @deprecated use pressable */
export const tapScale = {
  whileTap: { scale: 0.95 },
  transition: springs.microRebound,
}

/** @deprecated use pressable */
export const hoverScale = {
  whileHover: { scale: 1.02 },
  transition: springs.microRebound,
}

/** Keep staggers short so lists never block interaction. */
export const fastStagger = {
  staggerChildren: 0.03,
}

export const layoutTransition: Transition = {
  type: 'spring',
  duration: 0.35,
  bounce: 0.1,
}
