/**
 * PaceDistribution Component
 *
 * Displays pace distribution across splits with horizontal bar chart
 */

'use client'

import { useMemo } from 'react'

import { formatPace } from '@/lib/pace/calculator'
import { cn } from '@/lib/utils'

export interface PaceDistributionProps {
  splits: { pace: number; distance: number }[]
  averagePace: number
  className?: string
}

interface PaceZone {
  label: string
  minPace: number
  maxPace: number
  color: string
  count: number
  percentage: number
  totalDistance: number
}

/**
 * Calculate pace distribution zones
 */
function calculatePaceDistribution(
  splits: { pace: number; distance: number }[],
  averagePace: number,
): PaceZone[] {
  if (splits.length === 0) return []

  // Define pace zones relative to average
  const zones: Omit<PaceZone, 'count' | 'percentage' | 'totalDistance'>[] = [
    { label: '极快', minPace: 0, maxPace: averagePace - 30, color: 'bg-green' },
    { label: '快', minPace: averagePace - 30, maxPace: averagePace - 10, color: 'bg-green/60' },
    { label: '平均', minPace: averagePace - 10, maxPace: averagePace + 10, color: 'bg-yellow' },
    { label: '慢', minPace: averagePace + 10, maxPace: averagePace + 30, color: 'bg-orange' },
    { label: '极慢', minPace: averagePace + 30, maxPace: Infinity, color: 'bg-red' },
  ]

  const totalSplits = splits.length

  return zones.map((zone) => {
    const matchingSplits = splits.filter((s) => s.pace >= zone.minPace && s.pace < zone.maxPace)
    const count = matchingSplits.length
    const zoneDistance = matchingSplits.reduce((sum, s) => sum + s.distance, 0)

    return {
      ...zone,
      count,
      percentage: totalSplits > 0 ? (count / totalSplits) * 100 : 0,
      totalDistance: zoneDistance,
    }
  })
}

export function PaceDistribution({ splits, averagePace, className }: PaceDistributionProps) {
  const distribution = useMemo(
    () => calculatePaceDistribution(splits, averagePace),
    [splits, averagePace],
  )

  if (splits.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
          className,
        )}
      >
        <h3 className="text-label/80 mb-4 text-sm font-medium">配速分布</h3>
        <p className="text-label/50 text-center text-sm">暂无配速数据</p>
      </div>
    )
  }

  const maxPercentage = Math.max(...distribution.map((z) => z.percentage))

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-label/80 text-sm font-medium">配速分布</h3>
        <span className="text-label/50 text-xs">
          平均 {formatPace(averagePace)}/km · {splits.length} 公里
        </span>
      </div>

      {/* Distribution bars */}
      <div className="space-y-3">
        {distribution.map((zone) => (
          <div key={zone.label} className="group">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-label/70 font-medium">{zone.label}</span>
              <span className="text-label/50">
                {zone.count} 公里 · {zone.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
              <div
                className={cn('h-full rounded-full transition-all duration-500', zone.color)}
                style={{
                  width: `${maxPercentage > 0 ? (zone.percentage / maxPercentage) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="text-label/40 mt-0.5 flex justify-between text-xs">
              <span>
                {zone.minPace > 0 ? formatPace(zone.minPace) : `< ${formatPace(zone.maxPace)}`}
                {zone.maxPace < Infinity ? ` - ${formatPace(zone.maxPace)}` : '+'}
              </span>
              <span>{(zone.totalDistance / 1000).toFixed(2)} km</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-label/50">配速范围</span>
          <span className="text-label/70">
            {formatPace(Math.min(...splits.map((s) => s.pace)))} -{' '}
            {formatPace(Math.max(...splits.map((s) => s.pace)))} /km
          </span>
        </div>
      </div>
    </div>
  )
}
