/**
 * PersonalRecords Component
 *
 * Display personal best records (PR Wall)
 */

'use client'

import { Award, Bike, Clock, Flame, Footprints, Mountain, TrendingUp, Zap } from 'lucide-react'

import { calculateSpeed, formatDuration, formatPace } from '@/lib/pace/calculator'
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

type SportType = 'running' | 'cycling'

const SPORT_META = {
  running: {
    label: '跑步 PB',
    icon: Footprints,
    badgeClassName: 'bg-blue/10 text-blue',
  },
  cycling: {
    label: '骑行 PB',
    icon: Bike,
    badgeClassName: 'bg-orange/10 text-orange',
  },
} as const

/**
 * Calculate personal records from activities
 */
function calculatePersonalRecords(
  allActivities: ActivityListItem[],
  sportType: SportType,
): PersonalRecord[] {
  const activities = allActivities.filter((activity) => activity.type === sportType)
  if (activities.length === 0) return []

  const records: PersonalRecord[] = []

  // Longest distance
  const longestActivity = activities.reduce((max, a) => (a.distance > max.distance ? a : max))
  if (longestActivity.distance >= 1000) {
    records.push({
      title: '最长距离',
      value: (longestActivity.distance / 1000).toFixed(2),
      unit: 'km',
      date: new Date(longestActivity.startTime),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-blue',
      activityId: longestActivity.id,
    })
  }

  // Fastest pace for runs, fastest average speed for cycling.
  const validSpeedActivities = activities.filter((a) => a.distance >= 1000 && a.duration > 0)
  if (sportType === 'running') {
    const runsOver1km = validSpeedActivities.filter((a) => a.averagePace && a.averagePace > 0)
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
  } else if (validSpeedActivities.length > 0) {
    const fastestRide = validSpeedActivities.reduce((max, a) =>
      calculateSpeed(a.distance, a.duration) > calculateSpeed(max.distance, max.duration) ? a : max,
    )
    records.push({
      title: '最快均速',
      value: calculateSpeed(fastestRide.distance, fastestRide.duration).toFixed(1),
      unit: 'km/h',
      date: new Date(fastestRide.startTime),
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange',
      activityId: fastestRide.id,
    })
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
  const activitiesWithElevation = activities.filter((a) => a.elevationGain && a.elevationGain > 0)
  if (activitiesWithElevation.length > 0) {
    const mostElevation = activitiesWithElevation.reduce((max, a) =>
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

  if (sportType === 'running') {
    // Best 5K (closest to 5km with fastest pace)
    const runs5k = activities.filter(
      (a) => a.distance >= 4800 && a.distance <= 5500 && a.averagePace,
    )
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
  }

  return records
}

export function PersonalRecords({ activities, className }: PersonalRecordsProps) {
  const recordGroups = (['running', 'cycling'] as const)
    .map((type) => ({
      type,
      records: calculatePersonalRecords(activities, type),
    }))
    .filter((group) => group.records.length > 0)

  if (recordGroups.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-6 rounded-lg bg-transparent p-4 sm:p-5', className)}>
      {recordGroups.map((group) => {
        const meta = SPORT_META[group.type]
        const SportIcon = meta.icon

        return (
          <div key={group.type}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full',
                  meta.badgeClassName,
                )}
              >
                <SportIcon className="h-4 w-4" />
              </span>
              <h3 className="text-label text-sm font-medium">{meta.label}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
              {group.records.map((record) => (
                <div key={`${group.type}-${record.title}`} className="bg-transparent py-3 pr-3">
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
      })}
    </div>
  )
}
