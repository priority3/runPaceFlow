'use client'

import { motion } from 'framer-motion'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.RefObject<HTMLDivElement | null>
  /**
   * Enable hover animation
   * @default false
   */
  animated?: boolean
  /**
   * Enable entrance animation
   * @default false
   */
  fadeIn?: boolean
}

const Card = ({
  ref,
  className,
  animated = false,
  fadeIn = false,
  onAnimationStart,
  onAnimationEnd,
  ...props
}: CardProps) => {
  if (animated || fadeIn) {
    return (
      <motion.div
        ref={ref}
        initial={fadeIn ? { opacity: 0, y: 20 } : undefined}
        animate={fadeIn ? { opacity: 1, y: 0 } : undefined}
        whileHover={animated ? { y: -2, scale: 1.005 } : undefined}
        whileTap={animated ? { scale: 0.995 } : undefined}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          'border-separator bg-secondary-system-background text-label rounded-2xl border shadow-sm',
          className,
        )}
        {...(props as any)}
      />
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'border-separator bg-secondary-system-background text-label rounded-2xl border shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
Card.displayName = 'Card'

const CardHeader = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
)
CardHeader.displayName = 'CardHeader'

const CardTitle = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>
}) => (
  <h3
    ref={ref}
    className={cn('text-label text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
)
CardTitle.displayName = 'CardTitle'

const CardDescription = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>
}) => <p ref={ref} className={cn('text-secondary-label text-sm', className)} {...props} />
CardDescription.displayName = 'CardDescription'

const CardContent = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)
CardContent.displayName = 'CardContent'

const CardFooter = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
)
CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
