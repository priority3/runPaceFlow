import * as React from 'react'

import { cn } from '@/lib/utils'

const Card = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={cn(
      'border-separator bg-fill text-text rounded-2xl border shadow-sm',
      className,
    )}
    {...props}
  />
)
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
}: React.HTMLAttributes<HTMLHeadingElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => (
  <h3 ref={ref} className={cn('text-text text-lg font-semibold leading-none tracking-tight', className)} {...props} />
)
CardTitle.displayName = 'CardTitle'

const CardDescription = ({
  ref,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.RefObject<HTMLParagraphElement | null> }) => (
  <p ref={ref} className={cn('text-placeholder-text text-sm', className)} {...props} />
)
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
