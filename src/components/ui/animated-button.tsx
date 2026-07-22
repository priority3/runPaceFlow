/**
 * Animated Button Component
 *
 * Button with spring-based hover and tap animations
 */

'use client'

import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  default: 'bg-blue text-white hover:bg-blue/90 shadow-sm',
  ghost: 'bg-transparent hover:bg-secondary-system-background',
  outline: 'premium-surface bg-tertiary-system-background hover:bg-secondary-system-background',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const AnimatedButton = ({
  ref,
  className,
  variant = 'default',
  size = 'md',
  children,
  disabled,
  ...props
}: AnimatedButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  return (
    <motion.button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:ring-blue/50 focus-visible:ring-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
AnimatedButton.displayName = 'AnimatedButton'
