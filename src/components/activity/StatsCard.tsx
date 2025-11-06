/**
 * StatsCard Component
 *
 * Display running statistics in a card format
 */

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  className?: string
}

export function StatsCard({ title, value, unit, subtitle, className }: StatsCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <p className="text-placeholder-text text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-text text-3xl font-bold">{value}</span>
            {unit && <span className="text-placeholder-text text-sm">{unit}</span>}
          </div>
          {subtitle && <p className="text-placeholder-text text-xs opacity-70">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
