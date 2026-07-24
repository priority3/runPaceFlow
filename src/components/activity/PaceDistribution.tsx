/**
 * PaceDistribution Component
 *
 * Displays pace distribution across splits with horizontal bar chart
 */

'use client'

import { formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { PACE_COLOR_VARS } from '@/lib/theme/palette'
import { cn } from '@/lib/utils'

type MetricMode = 'pace' | 'speed'

export interface PaceDistributionProps {
  splits: { pace: number; distance: number }[]
  averagePace: number
  className?: string
  metric?: MetricMode
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
    { label: '极快', minPace: 0, maxPace: averagePace - 30, color: PACE_COLOR_VARS.veryFast },
    {
      label: '快',
      minPace: averagePace - 30,
      maxPace: averagePace - 10,
      color: PACE_COLOR_VARS.fast,
    },
    {
      label: '平均',
      minPace: averagePace - 10,
      maxPace: averagePace + 10,
      color: PACE_COLOR_VARS.average,
    },
    {
      label: '慢',
      minPace: averagePace + 10,
      maxPace: averagePace + 30,
      color: PACE_COLOR_VARS.slow,
    },
    {
      label: '极慢',
      minPace: averagePace + 30,
      maxPace: Infinity,
      color: PACE_COLOR_VARS.verySlow,
    },
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

function formatZoneRange(zone: PaceZone, metric: MetricMode): string {
  if (metric === 'pace') {
    const lowerBound = zone.minPace > 0 ? formatPace(zone.minPace) : `< ${formatPace(zone.maxPace)}`
    return zone.maxPace < Infinity
      ? `${lowerBound} - ${formatPace(zone.maxPace)}`
      : `${lowerBound}+`
  }

  if (zone.minPace <= 0) {
    return `> ${paceToSpeed(zone.maxPace).toFixed(1)} km/h`
  }

  if (zone.maxPace === Infinity) {
    return `< ${paceToSpeed(zone.minPace).toFixed(1)} km/h`
  }

  const minSpeed = paceToSpeed(zone.maxPace)
  const maxSpeed = paceToSpeed(zone.minPace)
  return `${minSpeed.toFixed(1)} - ${maxSpeed.toFixed(1)} km/h`
}

export function PaceDistribution({
  splits,
  averagePace,
  className,
  metric = 'pace',
}: PaceDistributionProps) {
  const distribution = calculatePaceDistribution(splits, averagePace)
  const isSpeedMode = metric === 'speed'
  const metricLabel = isSpeedMode ? '速度' : '配速'
  const averageMetric = isSpeedMode
    ? `${paceToSpeed(averagePace).toFixed(1)} km/h`
    : `${formatPace(averagePace)}/km`

  if (splits.length === 0) {
    return (
      <div className={cn('surface-panel p-5 sm:p-6', className)}>
        <h3 className="text-secondary-label mb-4 text-xs font-medium tracking-wide uppercase">
          {metricLabel}分布
        </h3>
        <p className="text-tertiary-label text-center text-sm">暂无{metricLabel}数据</p>
      </div>
    )
  }

  const maxPercentage = Math.max(...distribution.map((z) => z.percentage))

  return (
    <div className={cn('surface-panel p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-secondary-label text-xs font-medium tracking-wide uppercase">
          {metricLabel}分布
        </h3>
        <span className="text-tertiary-label text-[11px] tabular-nums">
          平均 {averageMetric} · {splits.length} 公里
        </span>
      </div>

      <div className="space-y-3.5">
        {distribution.map((zone) => (
          <div key={zone.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-secondary-label font-medium">{zone.label}</span>
              <span className="text-tertiary-label tabular-nums">
                {zone.count} · {zone.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="bg-quaternary-system-fill h-1.5 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxPercentage > 0 ? (zone.percentage / maxPercentage) * 100 : 0}%`,
                  backgroundColor: zone.color,
                  opacity: 0.72,
                }}
              />
            </div>
            <div className="text-quaternary-label mt-1 flex justify-between text-[11px]">
              <span>{formatZoneRange(zone, metric)}</span>
              <span className="tabular-nums">{(zone.totalDistance / 1000).toFixed(2)} km</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary-system-background/70 mt-5 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-tertiary-label">{metricLabel}范围</span>
          <span className="font-data text-secondary-label tabular-nums">
            {isSpeedMode
              ? `${Math.min(...splits.map((s) => paceToSpeed(s.pace))).toFixed(1)} - ${Math.max(
                  ...splits.map((s) => paceToSpeed(s.pace)),
                ).toFixed(1)} km/h`
              : `${formatPace(Math.min(...splits.map((s) => s.pace)))} - ${formatPace(
                  Math.max(...splits.map((s) => s.pace)),
                )} /km`}
          </span>
        </div>
      </div>
    </div>
  )
}
