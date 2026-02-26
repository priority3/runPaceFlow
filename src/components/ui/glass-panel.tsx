'use client'

import { motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.RefObject<HTMLDivElement | null>
  /**
   * Enable subtle hover/tap animation.
   * @default false
   */
  interactive?: boolean
  /**
   * Enable entrance fade-in animation.
   * @default false
   */
  fadeIn?: boolean
  /**
   * Visual density.
   * - default: main glass surface
   * - subtle: lighter chrome for nested items
   * @default "default"
   */
  tone?: 'default' | 'subtle'
}

const base =
  'rounded-2xl border border-separator/40 backdrop-blur-xl backdrop-saturate-150 shadow-sm shadow-black/5'

const tones = {
  default: 'bg-secondary-system-background/70',
  subtle: 'bg-secondary-system-background/55',
} as const

export function GlassPanel({
  ref,
  className,
  interactive = false,
  fadeIn = false,
  tone = 'default',
  onAnimationStart,
  onAnimationEnd,
  ...props
}: GlassPanelProps) {
  if (interactive || fadeIn) {
    return (
      <motion.div
        ref={ref}
        initial={fadeIn ? { opacity: 0, y: 4 } : undefined}
        animate={fadeIn ? { opacity: 1, y: 0 } : undefined}
        whileHover={interactive ? { y: -1, scale: 1.005 } : undefined}
        whileTap={interactive ? { scale: 0.995 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 30,
        }}
        className={cn(base, tones[tone], className)}
        {...(props as any)}
      />
    )
  }

  return <div ref={ref} className={cn(base, tones[tone], className)} {...props} />
}
