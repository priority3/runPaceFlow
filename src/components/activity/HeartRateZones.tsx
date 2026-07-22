/**
 * HeartRateZones Component
 *
 * Displays heart rate zone distribution with color-coded bars
 */

'use client'

import { HEART_RATE_ZONE_COLOR_VARS } from '@/lib/theme/palette'
import { cn } from '@/lib/utils'

export interface HeartRateZonesProps {
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  className?: string
}

/**
 * Heart rate zone definitions based on max heart rate percentage
 */
const ZONES = [
  {
    name: 'Z1 恢复',
    min: 50,
    max: 60,
    color: HEART_RATE_ZONE_COLOR_VARS[0],
    description: '轻松恢复',
  },
  {
    name: 'Z2 有氧',
    min: 60,
    max: 70,
    color: HEART_RATE_ZONE_COLOR_VARS[1],
    description: '基础耐力',
  },
  {
    name: 'Z3 有氧耐力',
    min: 70,
    max: 80,
    color: HEART_RATE_ZONE_COLOR_VARS[2],
    description: '提升耐力',
  },
  {
    name: 'Z4 乳酸阈值',
    min: 80,
    max: 90,
    color: HEART_RATE_ZONE_COLOR_VARS[3],
    description: '提升速度',
  },
  {
    name: 'Z5 无氧',
    min: 90,
    max: 100,
    color: HEART_RATE_ZONE_COLOR_VARS[4],
    description: '最大强度',
  },
]

/**
 * Estimate zone distribution based on average heart rate
 * Reason: Without detailed HR data, we estimate based on average HR position
 */
function estimateZoneDistribution(
  avgHR: number,
  maxHR: number,
): { zone: (typeof ZONES)[0]; percentage: number }[] {
  const avgPercentage = (avgHR / maxHR) * 100

  // Estimate distribution based on where average HR falls
  // This is a simplified model - real data would come from detailed HR tracking
  return ZONES.map((zone) => {
    const zoneMid = (zone.min + zone.max) / 2
    const distance = Math.abs(avgPercentage - zoneMid)

    // Calculate percentage based on distance from average
    // Closer zones get higher percentages
    let percentage = 0
    if (avgPercentage >= zone.min && avgPercentage <= zone.max) {
      percentage = 40 // Primary zone
    } else if (distance <= 15) {
      percentage = 25 // Adjacent zone
    } else if (distance <= 25) {
      percentage = 15 // Secondary zone
    } else if (distance <= 35) {
      percentage = 10 // Tertiary zone
    } else {
      percentage = 5 // Minimal time
    }

    return { zone, percentage }
  })
}

export function HeartRateZones({ averageHeartRate, maxHeartRate, className }: HeartRateZonesProps) {
  // Need both values to calculate zones
  if (!averageHeartRate || !maxHeartRate) {
    return (
      <div className={cn('premium-surface p-6', className)}>
        <h3 className="text-label/80 mb-4 text-sm font-medium">心率区间</h3>
        <p className="text-label/50 text-center text-sm">暂无心率数据</p>
      </div>
    )
  }

  const distribution = estimateZoneDistribution(averageHeartRate, maxHeartRate)
  const avgPercentage = Math.round((averageHeartRate / maxHeartRate) * 100)

  return (
    <div className={cn('premium-surface p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-label/80 text-sm font-medium">心率区间</h3>
        <span className="text-label/50 text-xs">平均 {avgPercentage}% 最大心率</span>
      </div>

      {/* Zone bars */}
      <div className="space-y-3">
        {distribution.map(({ zone, percentage }) => (
          <div key={zone.name} className="group">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-label/70 font-medium">{zone.name}</span>
              <span className="text-label/50">
                {zone.min}-{zone.max}% · {percentage}%
              </span>
            </div>
            <div className="bg-tertiary-system-fill h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: zone.color }}
              />
            </div>
            <p className="text-label/40 mt-0.5 text-xs">{zone.description}</p>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="bg-secondary-system-background mt-4 grid grid-cols-2 gap-4 rounded-lg px-4 py-3">
        <div>
          <span className="text-label/50 text-xs">平均心率</span>
          <p className="text-label text-lg font-semibold tabular-nums">
            {averageHeartRate}
            <span className="text-label/50 ml-1 text-sm">bpm</span>
          </p>
        </div>
        <div>
          <span className="text-label/50 text-xs">最大心率</span>
          <p className="text-label text-lg font-semibold tabular-nums">
            {maxHeartRate}
            <span className="text-label/50 ml-1 text-sm">bpm</span>
          </p>
        </div>
      </div>
    </div>
  )
}
