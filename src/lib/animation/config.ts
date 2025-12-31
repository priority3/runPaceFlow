/**
 * Animation Configuration
 *
 * Spring-based animation presets following Apple's guidelines
 * from WWDC 2023 "Animate with springs"
 */

// Spring presets
export const springs = {
  // Smooth - no bounce, for subtle transitions
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  // Snappy - small bounce, for interactions
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  // Bouncy - larger bounce, for emphasis
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
  },
  // Quick - fast response, minimal overshoot
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },
}

// Common animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

// Page transition config
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}

// Interaction feedback
export const tapScale = {
  whileTap: { scale: 0.98 },
  transition: springs.snappy,
}

export const hoverScale = {
  whileHover: { scale: 1.02 },
  transition: springs.snappy,
}

// Stagger config - keep it very fast to not block users
export const fastStagger = {
  staggerChildren: 0.02,
}

// Layout animation config for shared elements
export const layoutTransition = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 30,
}
