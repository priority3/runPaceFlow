'use client'

import { Slot } from '@radix-ui/react-slot'
import type { VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { buttonVariants } from './button-variants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /**
   * Enable haptic-like press animation
   * @default true
   */
  animated?: boolean
}

const Button = ({
  ref,
  className,
  variant,
  size,
  asChild = false,
  animated = true,
  onAnimationStart,
  onAnimationEnd,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const Comp = asChild ? Slot : 'button'

  if (animated && !asChild) {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        {...(props as any)}
      />
    )
  }

  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
}
Button.displayName = 'Button'

export { Button }

export { buttonVariants } from './button-variants'
