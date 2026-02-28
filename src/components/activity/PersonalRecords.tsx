/**
 * PersonalRecords Component
 *
 * Display personal best records (PR Wall)
 */

'use client'

import { Award, Clock, Flame, Mountain, TrendingUp, Zap } from 'lucide-react'
import { useMemo } from 'react'

import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { cn } from '@/lib/utils'
import type { ActivityListItem } from '@/types/activity'

export interface PersonalRecordsProps {
  activities: ActivityListItem[]
  className?: string
}

interface PersonalRecord {
  title: string
  value: string
  unit: string
  date: Date
  icon: React.ReactNode
  color: string
  activityId: string
}

/**
 * Calculate personal records from activities
 */
function calculatePersonalRecords(activities: ActivityListItem[]): PersonalRecord[] {
  if (activities.length === 0) return []

  const records: PersonalRecord[] = []

  // Longest distance
  const longestRun = activities.reduce((max, a) => (a.distance > max.distance ? a : max))
  if (longestRun.distance >= 1000) {
    records.push({
      title: '最长距离',
      value: (longestRun.distance / 1000).toFixed(2),
      unit: 'km',
      date: new Date(longestRun.startTime),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue',
      activityId: longestRun.id,
    })
  }

  // Fastest pace (for runs >= 1km)
  const runsOver1km = activities.filter(
    (a) => a.distance >= 1000 && a.averagePace && a.averagePace > 0,
  )
  if (runsOver1km.length > 0) {
    const fastestRun = runsOver1km.reduce((min, a) =>
      (a.averagePace || Infinity) < (min.averagePace || Infinity) ? a : min,
    )
    if (fastestRun.averagePace) {
      records.push({
        title: '最快配速',
        value: formatPace(fastestRun.averagePace),
        unit: '/km',
        date: new Date(fastestRun.startTime),
        icon: <Zap className="h-5 w-5" />,
        color: 'text-green',
        activityId: fastestRun.id,
      })
    }
  }

  // Longest duration
  const longestDuration = activities.reduce((max, a) => (a.duration > max.duration ? a : max))
  if (longestDuration.duration >= 600) {
    records.push({
      title: '最长时间',
      value: formatDuration(longestDuration.duration),
      unit: '',
      date: new Date(longestDuration.startTime),
      icon: <Clock className="h-5 w-5" />,
      color: 'text-purple',
      activityId: longestDuration.id,
    })
  }

  // Most elevation gain
  const runsWithElevation = activities.filter((a) => a.elevationGain && a.elevationGain > 0)
  if (runsWithElevation.length > 0) {
    const mostElevation = runsWithElevation.reduce((max, a) =>
      (a.elevationGain || 0) > (max.elevationGain || 0) ? a : max,
    )
    if (mostElevation.elevationGain && mostElevation.elevationGain >= 50) {
      records.push({
        title: '最大爬升',
        value: Math.round(mostElevation.elevationGain).toString(),
        unit: 'm',
        date: new Date(mostElevation.startTime),
        icon: <Mountain className="h-5 w-5" />,
        color: 'text-orange',
        activityId: mostElevation.id,
      })
    }
  }

  // Best 5K (closest to 5km with fastest pace)
  const runs5k = activities.filter((a) => a.distance >= 4800 && a.distance <= 5500 && a.averagePace)
  if (runs5k.length > 0) {
    const best5k = runs5k.reduce((min, a) =>
      (a.averagePace || Infinity) < (min.averagePace || Infinity) ? a : min,
    )
    records.push({
      title: '5K 最佳',
      value: formatDuration(best5k.duration),
      unit: '',
      date: new Date(best5k.startTime),
      icon: <Award className="h-5 w-5" />,
      color: 'text-yellow',
      activityId: best5k.id,
    })
  }

  // Best 10K
  const runs10k = activities.filter(
    (a) => a.distance >= 9500 && a.distance <= 10500 && a.averagePace,
  )
  if (runs10k.length > 0) {
    const best10k = runs10k.reduce((min, a) =>
      (a.averagePace || Infinity) < (min.averagePace || Infinity) ? a : min,
    )
    records.push({
      title: '10K 最佳',
      value: formatDuration(best10k.duration),
      unit: '',
      date: new Date(best10k.startTime),
      icon: <Flame className="h-5 w-5" />,
      color: 'text-red',
      activityId: best10k.id,
    })
  }

  return records
}

export function PersonalRecords({ activities, className }: PersonalRecordsProps) {
  const records = useMemo(() => calculatePersonalRecords(activities), [activities])

  if (records.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/50 p-4 backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-black/20',
        className,
      )}
    >
      <h3 className="text-label mb-3 text-sm font-medium sm:mb-4">个人记录</h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {records.map((record) => (
          <div
            key={record.title}
            className="group rounded-xl bg-white/40 p-3 transition-colors hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className={cn('mb-2', record.color)}>{record.icon}</div>
            <div className="text-label/60 mb-1 text-xs">{record.title}</div>
            <div className="text-label flex items-baseline gap-0.5">
              <span className="text-xl font-semibold tabular-nums">{record.value}</span>
              {record.unit && <span className="text-label/50 text-xs">{record.unit}</span>}
            </div>
            <div className="text-label/40 mt-1 text-xs">
              {record.date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
