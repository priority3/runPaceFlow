/**
 * Skeleton — paper-soft shimmer placeholders (Shiro-style, no hard white blocks).
 */

import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  ...props
}: SkeletonProps) {
  const styles = {
    width: width || undefined,
    height: height || undefined,
  }

  const variantClasses = {
    default: 'rounded-md',
    text: 'rounded h-3.5',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  return (
    <div
      className={cn('skeleton-shimmer', variantClasses[variant], className)}
      style={styles}
      {...props}
    />
  )
}

/** Matches SportPanel metric layout while stats load. */
export function SportPanelSkeleton({ className }: { className?: string }) {
  return (
    <article className={cn('overflow-hidden py-2', className)} aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24 opacity-70" />
          </div>
        </div>
        <Skeleton className="h-3 w-10 opacity-60" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`metric-skel-${index}`} className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-12 opacity-60" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-14 opacity-50" />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1.4fr] sm:items-end">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-14 opacity-60" />
            <Skeleton className="h-3 w-12 opacity-50" />
          </div>
          <div className="flex h-9 items-end gap-1">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={`trend-skel-${index}`}
                className="min-h-1 flex-1 rounded-[2px]"
                style={{ height: `${30 + ((index * 17) % 50)}%` }}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-14 opacity-60" />
            <Skeleton className="h-3 w-8 opacity-50" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
    </article>
  )
}

/** Compact row placeholder for activity list. */
export function ActivityRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-4 rounded-xl px-1 py-4 sm:gap-6', className)}
      aria-hidden="true"
    >
      <Skeleton variant="circular" className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5 max-w-48" />
        <Skeleton className="h-3 w-1/3 max-w-36 opacity-60" />
      </div>
      <div className="hidden shrink-0 space-y-2 text-right sm:block">
        <Skeleton className="ml-auto h-4 w-16" />
        <Skeleton className="ml-auto h-3 w-12 opacity-60" />
      </div>
      <Skeleton className="hidden h-4 w-14 shrink-0 md:block" />
    </div>
  )
}

export function SkeletonGroup({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton className="h-5 w-2/5" />
      <Skeleton className="h-3.5 w-full opacity-80" />
      <Skeleton className="h-3.5 w-4/5 opacity-60" />
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-panel p-5 sm:p-6', className)}>
      <div className="space-y-3">
        <Skeleton className="h-3.5 w-1/4 opacity-70" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-3 w-1/2 opacity-60" />
      </div>
    </div>
  )
}

export function SkeletonTableRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-3', className)}>
      <Skeleton className="h-3.5 w-1/4" />
      <Skeleton className="h-3.5 w-1/6 opacity-80" />
      <Skeleton className="h-3.5 w-1/6 opacity-70" />
      <Skeleton className="h-3.5 w-1/6 opacity-60" />
    </div>
  )
}
