'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode
  value: React.ReactNode
  unit?: React.ReactNode
  size?: 'hero' | 'default'
}

const sizes = {
  hero: 'text-3xl sm:text-4xl',
  default: 'text-2xl',
} as const

export function Metric({ label, value, unit, size = 'default', className, ...props }: MetricProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      {label && <div className="text-secondary-label text-xs font-medium">{label}</div>}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            'text-label leading-none font-semibold tracking-tight tabular-nums',
            sizes[size],
          )}
        >
          {value}
        </span>
        {unit && <span className="text-tertiary-label text-xs font-medium">{unit}</span>}
      </div>
    </div>
  )
}
