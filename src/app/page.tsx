/**
 * RunPaceFlow home dashboard
 *
 * A continuous training telemetry view built around real activity data.
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowDown,
  Bike,
  CalendarDays,
  Clock3,
  Footprints,
  Gauge,
  MapPin,
  Route,
  Target,
  TrendingUp,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { useState } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { Header } from '@/components/layout/Header'
import { useActivityStats, useInfiniteActivities, useMapRoutes } from '@/hooks/use-activities'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useRuntimeConfig } from '@/hooks/use-runtime-config'
import type { PublicRuntimeConfig } from '@/lib/runtime-config/types'
import { useTheme } from '@/lib/theme'
import { getSportColors } from '@/lib/theme/palette'
import { cn } from '@/lib/utils'
import type { ActivityListItem } from '@/types/activity'
import type { RouteData } from '@/types/map'

const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((module) => ({ default: module.RunMap })),
  {
    ssr: false,
    loading: () => <div className="bg-tertiary-system-background h-full min-h-80 animate-pulse" />,
  },
)

const RouteLayer = dynamic(() =>
  import('@/components/map/RouteLayer').then((module) => ({ default: module.RouteLayer })),
)

const ActivityHeatmap = dynamic(() =>
  import('@/components/activity/ActivityHeatmap').then((module) => ({
    default: module.ActivityHeatmap,
  })),
)

const PersonalRecords = dynamic(() =>
  import('@/components/activity/PersonalRecords').then((module) => ({
    default: module.PersonalRecords,
  })),
)

type StatsPeriod = 'week' | 'month'
type SportType = 'running' | 'cycling'
type RouteFilter = 'all' | SportType
type TrainingFocusId = 'goals' | 'recovery' | 'routes' | 'activityLog'
type ActivityStatsData = NonNullable<ReturnType<typeof useActivityStats>['data']>
type TrainingGoals = PublicRuntimeConfig['goals']
type IconComponent = ComponentType<{ className?: string }>

const SPORT_TYPES: SportType[] = ['running', 'cycling']
const TREND_DAY_KEYS = ['day-6', 'day-5', 'day-4', 'day-3', 'day-2', 'day-1', 'day-0']

const SPORT_CONFIG: Record<
  SportType,
  {
    label: string
    icon: IconComponent
    accentClassName: string
    softClassName: string
  }
> = {
  running: {
    label: '跑步',
    icon: Footprints,
    accentClassName: 'bg-blue',
    softClassName: 'bg-blue/10 text-blue',
  },
  cycling: {
    label: '骑行',
    icon: Bike,
    accentClassName: 'bg-orange',
    softClassName: 'bg-orange/10 text-orange',
  },
}

const FOCUS_META: Record<
  TrainingFocusId,
  {
    label: string
    icon: IconComponent
    colorClassName: string
    softClassName: string
  }
> = {
  goals: {
    label: '目标',
    icon: Target,
    colorClassName: 'bg-blue',
    softClassName: 'bg-blue/10 text-blue',
  },
  recovery: {
    label: '负荷',
    icon: Gauge,
    colorClassName: 'bg-purple',
    softClassName: 'bg-purple/10 text-purple',
  },
  routes: {
    label: '路线',
    icon: Route,
    colorClassName: 'bg-teal',
    softClassName: 'bg-teal/10 text-teal',
  },
  activityLog: {
    label: '记录',
    icon: Activity,
    colorClassName: 'bg-gray',
    softClassName: 'bg-gray/10 text-gray',
  },
}

interface TrainingFocus {
  id: TrainingFocusId
  title: string
  summary: string
  metric: string
  metricLabel: string
  actionLabel: string
  sectionId: string
}

interface SportSummary {
  type: SportType
  label: string
  icon: IconComponent
  accentClassName: string
  softClassName: string
  data: ActivityStatsData['byType'][SportType]
  current: {
    activities: number
    distance: number
    duration: number
  }
  previous: {
    activities: number
    distance: number
    duration: number
  }
  distanceGoal: number
  durationGoal: number
  periodLabel: string
  compareLabel: string
}

interface DashboardRoute extends RouteData {
  sportType: SportType
}

function getDominantRouteCluster(routes: DashboardRoute[]) {
  if (routes.length < 3) return routes

  const routeCenters = routes.map((route) => {
    const center = route.coordinates.reduce(
      (result, coordinate) => ({
        latitude: result.latitude + coordinate.latitude,
        longitude: result.longitude + coordinate.longitude,
      }),
      { latitude: 0, longitude: 0 },
    )

    return {
      route,
      latitude: center.latitude / route.coordinates.length,
      longitude: center.longitude / route.coordinates.length,
    }
  })
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }
  const medianLatitude = median(routeCenters.map((center) => center.latitude))
  const medianLongitude = median(routeCenters.map((center) => center.longitude))
  const nearbyRoutes = routeCenters.filter((center) => {
    const latitudeDistance = (center.latitude - medianLatitude) * 111
    const longitudeDistance =
      (center.longitude - medianLongitude) * 111 * Math.cos((medianLatitude * Math.PI) / 180)

    return Math.hypot(latitudeDistance, longitudeDistance) <= 80
  })

  // Keep occasional destination workouts loaded without letting them flatten the main training area.
  return nearbyRoutes.length >= Math.ceil(routes.length * 0.6)
    ? nearbyRoutes.map(({ route }) => route)
    : routes
}

function formatDistance(distanceMeters: number | null | undefined, decimals = 1) {
  return `${((distanceMeters ?? 0) / 1000).toFixed(decimals)} km`
}

function formatDurationHours(durationSeconds: number | null | undefined) {
  return `${((durationSeconds ?? 0) / 3600).toFixed(1)} h`
}

function formatActivityDate(value: Date | string | null | undefined) {
  if (!value) return '暂无活动'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无活动'

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
}

function progressPercent(current: number, goal: number) {
  if (goal <= 0) return 0
  return Math.min(Math.round((current / goal) * 100), 100)
}

function changeLabel(current: number, previous: number) {
  if (previous <= 0) return '暂无对比'
  const change = Math.round(((current - previous) / previous) * 100)
  return `${change >= 0 ? '+' : ''}${change}%`
}

function buildTrainingFocuses(
  stats: ActivityStatsData | undefined,
  activities: ActivityListItem[],
  routeCount: number,
  goals: TrainingGoals,
  isLoading: boolean,
): TrainingFocus[] {
  if (isLoading) {
    return [
      {
        id: 'goals',
        title: '正在整理训练信号',
        summary: '目标、负荷和路线数据正在汇总。',
        metric: '···',
        metricLabel: '读取中',
        actionLabel: '查看训练量',
        sectionId: 'training-volume',
      },
      {
        id: 'recovery',
        title: '正在计算最近负荷',
        summary: '读取完成后会显示与上一周期的变化。',
        metric: '···',
        metricLabel: '读取中',
        actionLabel: '查看训练日历',
        sectionId: 'training-rhythm',
      },
      {
        id: 'routes',
        title: '正在解析真实路线',
        summary: '户外活动的 GPS 轨迹正在准备。',
        metric: '···',
        metricLabel: '读取中',
        actionLabel: '查看路线',
        sectionId: 'route-map',
      },
    ]
  }

  if ((stats?.total.activities ?? activities.length) === 0) {
    return [
      {
        id: 'activityLog',
        title: '还没有可复盘的活动',
        summary: '先在 Admin 中完成数据接入，记录出现后这里会自动生成训练焦点。',
        metric: '0',
        metricLabel: '条活动',
        actionLabel: '查看活动记录',
        sectionId: 'activity-log',
      },
    ]
  }

  const runningWeek = stats?.byType.running.thisWeek.distance ?? 0
  const cyclingWeek = stats?.byType.cycling.thisWeek.distance ?? 0
  const weeklyDistance = runningWeek + cyclingWeek
  const weeklyGoal = goals.running.weeklyDistance + goals.cycling.weeklyDistance
  const weeklyProgress = progressPercent(weeklyDistance, weeklyGoal)

  const thisWeekDuration =
    (stats?.byType.running.thisWeek.duration ?? 0) + (stats?.byType.cycling.thisWeek.duration ?? 0)
  const lastWeekDuration =
    (stats?.byType.running.lastWeek.duration ?? 0) + (stats?.byType.cycling.lastWeek.duration ?? 0)
  const durationChange =
    lastWeekDuration > 0
      ? Math.round(((thisWeekDuration - lastWeekDuration) / lastWeekDuration) * 100)
      : null

  const outdoorActivities = activities.filter((activity) => !activity.isIndoor)
  const longestOutdoorActivity = outdoorActivities.reduce<ActivityListItem | null>(
    (longest, activity) => (!longest || activity.distance > longest.distance ? activity : longest),
    null,
  )

  return [
    {
      id: 'goals',
      title: weeklyProgress >= 100 ? '本周目标已经到线' : '本周还有多少空间',
      summary:
        weeklyProgress >= 100
          ? `已完成 ${formatDistance(weeklyDistance)}，接下来更值得观察负荷和恢复。`
          : `已完成 ${formatDistance(weeklyDistance)}，周目标为 ${formatDistance(weeklyGoal)}。`,
      metric: `${weeklyProgress}%`,
      metricLabel: '目标进度',
      actionLabel: '查看训练量',
      sectionId: 'training-volume',
    },
    {
      id: 'recovery',
      title:
        durationChange !== null && durationChange > 25 ? '训练负荷正在抬升' : '看看最近的训练节奏',
      summary:
        durationChange === null
          ? `本周累计 ${formatDurationHours(thisWeekDuration)}，结合日历判断下一次训练时机。`
          : `本周累计 ${formatDurationHours(thisWeekDuration)}，较上周${durationChange >= 0 ? '增加' : '减少'} ${Math.abs(durationChange)}%。`,
      metric:
        durationChange === null
          ? formatDurationHours(thisWeekDuration)
          : `${durationChange >= 0 ? '+' : ''}${durationChange}%`,
      metricLabel: durationChange === null ? '本周时长' : '负荷变化',
      actionLabel: '查看训练日历',
      sectionId: 'training-rhythm',
    },
    {
      id: 'routes',
      title: routeCount > 0 ? '从一条真实路线开始复盘' : '路线数据仍在等待',
      summary:
        routeCount > 0
          ? `${routeCount} 条路线已进入地图，最长户外活动为 ${formatDistance(longestOutdoorActivity?.distance)}。`
          : '当前没有可展示的 GPS 轨迹，可以先从活动记录检查户外数据。',
      metric: `${routeCount}`,
      metricLabel: '条路线',
      actionLabel: routeCount > 0 ? '查看路线地图' : '查看活动记录',
      sectionId: routeCount > 0 ? 'route-map' : 'activity-log',
    },
  ]
}

function PaceRibbon({
  activities,
  isLoading,
}: {
  activities: ActivityListItem[]
  isLoading: boolean
}) {
  const samples = activities.slice(0, 20).reverse()
  const maxDistance = Math.max(1, ...samples.map((activity) => activity.distance))
  const displaySamples: Array<ActivityListItem | null> = isLoading
    ? Array.from({ length: 20 }, () => null)
    : samples

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-secondary-label flex items-center gap-2 text-xs">
          <span className="bg-green h-2 w-2 rounded-full" aria-hidden="true" />
          <span>最近活动节奏</span>
        </div>
        <span className="text-tertiary-label font-data text-[11px] tabular-nums">
          {isLoading ? 'READING' : `${samples.length} SAMPLES`}
        </span>
      </div>

      <div
        className="relative flex h-16 items-center gap-1.5 overflow-hidden"
        role="img"
        aria-label={isLoading ? '正在读取最近活动' : `最近 ${samples.length} 次活动的距离强度`}
      >
        {displaySamples.map((activity, index) => {
          const height = activity ? Math.max(14, (activity.distance / maxDistance) * 100) : 28
          return (
            <motion.span
              key={activity?.id ?? `ribbon-loading-${index}`}
              className={cn(
                'relative z-10 min-w-1 flex-1 rounded-full',
                isLoading ? 'bg-quaternary-system-fill animate-pulse' : 'bg-blue',
              )}
              style={{ height: `${height}%`, opacity: 0.28 + (index / 20) * 0.72 }}
              initial={isLoading ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.35, delay: index * 0.012 }}
            />
          )
        })}
      </div>
    </div>
  )
}

function FocusConsole({
  activities,
  goals,
  isLoading,
  routeCount,
  stats,
}: {
  activities: ActivityListItem[]
  goals: TrainingGoals
  isLoading: boolean
  routeCount: number
  stats: ActivityStatsData | undefined
}) {
  const reduceMotion = useReducedMotion()
  const focuses = buildTrainingFocuses(stats, activities, routeCount, goals, isLoading)
  const latestActivity = activities[0]

  const recommendedFocusId = (() => {
    if (focuses.length === 1) return focuses[0].id
    const recoveryMetric = Number.parseFloat(
      focuses.find((focus) => focus.id === 'recovery')?.metric ?? '0',
    )
    const goalMetric = Number.parseFloat(
      focuses.find((focus) => focus.id === 'goals')?.metric ?? '0',
    )

    if (recoveryMetric >= 25) return 'recovery'
    if (goalMetric < 100) return 'goals'
    return routeCount > 0 ? 'routes' : 'recovery'
  })()

  const [selectedId, setSelectedId] = useState<TrainingFocusId | null>(null)
  const activeId = selectedId ?? recommendedFocusId
  const focus = focuses.find((item) => item.id === activeId) ?? focuses[0]

  const scrollToSection = () => {
    document.querySelector<HTMLElement>(`#${focus.sectionId}`)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="flex h-full flex-col justify-center py-2 lg:min-h-[31rem] lg:pr-10">
      <div>
        <div className="text-tertiary-label mb-5 flex items-center gap-2 text-xs font-medium">
          <TrendingUp className="h-3.5 w-3.5" />
          今日训练焦点
        </div>

        <h2 className="font-display text-label max-w-xl text-[2.35rem] leading-[1.08] font-semibold sm:text-5xl lg:text-[3.25rem]">
          <span className="block sm:whitespace-nowrap">从最近一次开始，</span>
          <span className="block sm:whitespace-nowrap">找到下一步。</span>
        </h2>

        <p className="text-secondary-label mt-5 text-sm leading-6 sm:text-base">
          {latestActivity
            ? `${latestActivity.type === 'cycling' ? '骑行' : '跑步'} · ${formatActivityDate(latestActivity.startTime)} · ${formatDistance(latestActivity.distance)}`
            : '等待第一条训练记录'}
        </p>

        <div
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
          role="tablist"
          aria-label="训练焦点"
        >
          {focuses.map((item) => {
            const meta = FOCUS_META[item.id]
            const ItemIcon = meta.icon
            const selected = item.id === focus.id

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'text-tertiary-label flex min-h-9 items-center gap-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-blue focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4',
                  selected ? 'text-label' : 'hover:text-secondary-label',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full opacity-0 transition-opacity',
                    meta.colorClassName,
                    selected && 'opacity-100',
                  )}
                  aria-hidden="true"
                />
                <ItemIcon className="h-4 w-4 shrink-0" />
                <span>{meta.label}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={focus.id}
            role="tabpanel"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mt-9 grid items-end gap-6 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0">
              <h3 className="text-label text-lg font-semibold">{focus.title}</h3>
              <p className="text-secondary-label mt-2 max-w-md text-sm leading-6">
                {focus.summary}
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <div className="font-data text-label text-4xl font-semibold tabular-nums">
                {focus.metric}
              </div>
              <div className="text-tertiary-label mt-1 text-xs">{focus.metricLabel}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={scrollToSection}
        className="text-blue focus-visible:outline-blue mt-9 inline-flex h-10 w-fit items-center gap-2 text-sm font-semibold transition-all hover:gap-3 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {focus.actionLabel}
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  )
}

function MetricCell({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-tertiary-label text-xs">{label}</div>
      <div className="font-data text-label mt-2 truncate text-2xl font-semibold tabular-nums">
        {value}
      </div>
      {detail && <div className="text-secondary-label mt-1 text-xs">{detail}</div>}
    </div>
  )
}

function MiniTrend({ values, colorClassName }: { values: number[]; colorClassName: string }) {
  const maxValue = Math.max(1, ...values)

  return (
    <div className="flex h-9 items-end gap-1" role="img" aria-label="最近七天距离趋势">
      {TREND_DAY_KEYS.map((dayKey, index) => (
        <span
          key={dayKey}
          className={cn('min-h-1 flex-1 rounded-[2px]', colorClassName)}
          style={{
            height: `${Math.max(10, ((values[index] ?? 0) / maxValue) * 100)}%`,
            opacity: 0.2 + index * 0.1,
          }}
        />
      ))}
    </div>
  )
}

function SportPanel({ sport }: { sport: SportSummary }) {
  const SportIcon = sport.icon
  const distanceProgress = progressPercent(sport.current.distance, sport.distanceGoal)

  return (
    <article className="overflow-hidden py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md',
              sport.softClassName,
            )}
          >
            <SportIcon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-label text-base font-semibold">{sport.label}</h3>
            <p className="text-tertiary-label mt-0.5 text-xs">
              累计 {formatDistance(sport.data.total.distance)}
            </p>
          </div>
        </div>
        <span className="font-data text-secondary-label text-xs tabular-nums">
          {sport.periodLabel.toUpperCase()}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-4">
        <MetricCell label="活动" value={`${sport.data.total.activities}`} detail="累计次数" />
        <MetricCell
          label={`${sport.periodLabel}距离`}
          value={formatDistance(sport.current.distance)}
          detail={changeLabel(sport.current.distance, sport.previous.distance)}
        />
        <MetricCell
          label={`${sport.periodLabel}时长`}
          value={formatDurationHours(sport.current.duration)}
          detail={changeLabel(sport.current.duration, sport.previous.duration)}
        />
        <MetricCell
          label="目标"
          value={`${distanceProgress}%`}
          detail={formatDistance(sport.distanceGoal)}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1.4fr] sm:items-end">
        <div>
          <div className="text-tertiary-label mb-2 flex items-center justify-between text-xs">
            <span>7 天距离</span>
            <span>{sport.compareLabel}</span>
          </div>
          <MiniTrend values={sport.data.weeklyTrend} colorClassName={sport.accentClassName} />
        </div>

        <div>
          <div className="text-tertiary-label mb-2 flex items-center justify-between text-xs">
            <span>距离目标</span>
            <span className="font-data tabular-nums">{distanceProgress}%</span>
          </div>
          <div className="bg-quaternary-system-fill h-1.5 overflow-hidden rounded-full">
            <motion.div
              className={cn('h-full rounded-full', sport.accentClassName)}
              initial={{ width: 0 }}
              whileInView={{ width: `${distanceProgress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-tertiary-label mb-2 text-xs font-medium">{eyebrow}</div>
        <h2 className="font-display text-label text-3xl font-semibold sm:text-[2.15rem]">
          {title}
        </h2>
        {description && (
          <p className="text-secondary-label mt-2 max-w-2xl text-sm leading-6">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export default function HomePage() {
  const { resolvedTheme } = useTheme()
  const sportRouteColors = getSportColors(resolvedTheme)
  const runtimeConfig = useRuntimeConfig()
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const {
    data: activitiesPages,
    isLoading: activitiesLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteActivities({ limit: 20 })
  const { data: mapRoutesData, isLoading: mapRoutesLoading } = useMapRoutes(20)
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('week')
  const [routeFilter, setRouteFilter] = useState<RouteFilter>('all')

  const activities = activitiesPages?.pages.flatMap((page) => page.activities) ?? []
  const totalActivities = activitiesPages?.pages[0]?.pagination.total ?? activities.length

  const routes: DashboardRoute[] = (mapRoutesData ?? [])
    .map((item) => {
      const sportType: SportType = item.type === 'cycling' ? 'cycling' : 'running'

      return {
        id: item.id,
        sportType,
        coordinates: item.coordinates.map((coordinate) => ({
          latitude: coordinate.lat,
          longitude: coordinate.lng,
        })),
        color: sportRouteColors[sportType],
        width: sportType === 'cycling' ? 4 : 3,
      }
    })
    .filter((route) => route.coordinates.length > 0)

  const visibleRoutes =
    routeFilter === 'all' ? routes : routes.filter((route) => route.sportType === routeFilter)
  const boundsRoutes =
    routeFilter === 'all' ? visibleRoutes : getDominantRouteCluster(visibleRoutes)

  const bounds = (() => {
    if (boundsRoutes.length === 0) return null

    const coordinates = boundsRoutes.flatMap((route) => route.coordinates)
    const latitudes = coordinates.map((coordinate) => coordinate.latitude)
    const longitudes = coordinates.map((coordinate) => coordinate.longitude)

    return {
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes),
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
    }
  })()

  const sportStats: SportSummary[] | null = stats
    ? SPORT_TYPES.map((type) => {
        const data = stats.byType[type]
        const goals = runtimeConfig.goals[type] ?? runtimeConfig.goals.running
        const current = statsPeriod === 'week' ? data.thisWeek : data.thisMonth
        const previous = statsPeriod === 'week' ? data.lastWeek : data.lastMonth
        const config = SPORT_CONFIG[type]

        return {
          type,
          label: config.label,
          icon: config.icon,
          accentClassName: config.accentClassName,
          softClassName: config.softClassName,
          data,
          current,
          previous,
          distanceGoal: statsPeriod === 'week' ? goals.weeklyDistance : goals.monthlyDistance,
          durationGoal: statsPeriod === 'week' ? goals.weeklyDuration : goals.monthlyDuration,
          periodLabel: statsPeriod === 'week' ? '本周' : '本月',
          compareLabel: statsPeriod === 'week' ? '对比上周' : '对比上月',
        }
      })
    : null

  const totalDistance =
    (stats?.byType.running.total.distance ?? 0) + (stats?.byType.cycling.total.distance ?? 0)
  const totalDuration =
    (stats?.byType.running.total.duration ?? 0) + (stats?.byType.cycling.total.duration ?? 0)
  const latestActivity = activities[0]
  const dashboardLoading = statsLoading || activitiesLoading || mapRoutesLoading

  return (
    <div className="bg-system-background min-h-screen">
      <Header />

      <main>
        <section
          id="overview"
          className="scroll-mt-20 px-5 pt-10 pb-20 sm:px-7 sm:pt-14 lg:px-10 lg:pt-16 lg:pb-28"
        >
          <div className="mx-auto max-w-[82rem]">
            <div className="mb-10 flex items-center justify-between gap-4">
              <div className="text-secondary-label flex items-center gap-2 text-sm font-medium">
                <Activity className="text-blue h-4 w-4" />
                <span>今日训练</span>
              </div>
              <span className="text-tertiary-label text-xs">
                最近更新 · {formatActivityDate(latestActivity?.startTime)}
              </span>
            </div>

            <PaceRibbon activities={activities} isLoading={activitiesLoading} />

            <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
              <FocusConsole
                activities={activities}
                goals={runtimeConfig.goals}
                isLoading={dashboardLoading}
                routeCount={routes.length}
                stats={stats}
              />

              <div
                id="route-map"
                className="bg-secondary-system-background relative min-h-[24rem] scroll-mt-20 overflow-hidden rounded-lg sm:min-h-[32rem]"
              >
                <RunMap
                  className="absolute inset-0 h-full w-full"
                  bounds={bounds || undefined}
                  mapStyleUrl={runtimeConfig.mapStyle}
                  boundsPadding={48}
                >
                  {visibleRoutes.length > 0 && <RouteLayer routes={visibleRoutes} />}
                </RunMap>

                <div className="bg-tertiary-system-background/88 text-label absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full p-1 shadow-sm backdrop-blur-xl">
                  <div className="pointer-events-none flex items-center gap-2 px-2">
                    <Route className="h-4 w-4" />
                    <span className="text-xs font-medium tabular-nums">
                      {mapRoutesLoading ? '读取路线' : `${visibleRoutes.length} 条`}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5" role="group" aria-label="路线类型">
                    {(['all', ...SPORT_TYPES] as RouteFilter[]).map((filter) => {
                      const selected = routeFilter === filter
                      const label = filter === 'all' ? '全部' : SPORT_CONFIG[filter].label
                      const FilterIcon = filter === 'all' ? Route : SPORT_CONFIG[filter].icon

                      return (
                        <button
                          key={filter}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setRouteFilter(filter)}
                          className={cn(
                            'flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-colors',
                            selected
                              ? 'bg-system-fill text-label'
                              : 'text-secondary-label hover:bg-tertiary-system-fill hover:text-label',
                          )}
                        >
                          <FilterIcon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-tertiary-system-background/88 text-secondary-label pointer-events-none absolute bottom-3 left-3 z-20 flex items-center gap-4 rounded-full px-3 py-2 text-[11px] shadow-sm backdrop-blur-xl">
                  {SPORT_TYPES.map((type) => (
                    <span
                      key={type}
                      className={cn(
                        'flex items-center gap-2 transition-opacity',
                        routeFilter !== 'all' && routeFilter !== type && 'opacity-35',
                      )}
                    >
                      <span
                        className="h-1.5 w-5 rounded-full"
                        style={{ backgroundColor: sportRouteColors[type] }}
                      />
                      {SPORT_CONFIG[type].label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-4">
              {[
                {
                  label: '总活动',
                  value: dashboardLoading ? '—' : `${stats?.total.activities ?? totalActivities}`,
                  icon: Activity,
                },
                {
                  label: '总距离',
                  value: dashboardLoading ? '—' : formatDistance(totalDistance),
                  icon: MapPin,
                },
                {
                  label: '总时长',
                  value: dashboardLoading ? '—' : formatDurationHours(totalDuration),
                  icon: Clock3,
                },
                {
                  label: '地图路线',
                  value: mapRoutesLoading ? '—' : `${routes.length}`,
                  icon: Route,
                },
              ].map((item) => {
                const ItemIcon = item.icon
                return (
                  <div key={item.label} className="flex min-w-0 items-start gap-3">
                    <ItemIcon className="text-tertiary-label mt-1 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-tertiary-label text-[11px]">{item.label}</div>
                      <div className="font-data text-label mt-1.5 truncate text-xl font-semibold tabular-nums">
                        {item.value}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="training-volume" className="scroll-mt-14 px-5 py-20 sm:px-7 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="训练量"
              title="跑步与骑行"
              action={
                <div
                  className="bg-tertiary-system-fill grid grid-cols-2 rounded-lg p-1"
                  role="group"
                  aria-label="统计周期"
                >
                  {(['week', 'month'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      aria-pressed={statsPeriod === period}
                      onClick={() => setStatsPeriod(period)}
                      className={cn(
                        'text-secondary-label min-h-9 rounded-md px-4 text-sm font-medium transition-colors',
                        'focus-visible:outline-blue focus-visible:outline-2 focus-visible:outline-offset-2',
                        statsPeriod === period && 'bg-system-background text-label shadow-sm',
                      )}
                    >
                      {period === 'week' ? '本周' : '本月'}
                    </button>
                  ))}
                </div>
              }
            />

            {statsLoading ? (
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                {[0, 1].map((index) => (
                  <div
                    key={`sport-loading-${index}`}
                    className="bg-secondary-system-background h-72 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : sportStats ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={statsPeriod}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="grid gap-12 lg:grid-cols-2 lg:gap-16"
                >
                  {sportStats.map((sport) => (
                    <SportPanel key={sport.type} sport={sport} />
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>
        </section>

        {activities.length > 0 && (
          <section
            id="training-rhythm"
            className="bg-secondary-system-background scroll-mt-14 px-5 py-20 sm:px-7 lg:px-10 lg:py-28"
          >
            <div className="mx-auto max-w-7xl">
              <SectionHeading eyebrow="训练节奏" title="连续性与个人纪录" />

              <div className="grid gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
                <div className="overflow-hidden">
                  <div className="mb-5 flex items-center gap-2">
                    <CalendarDays className="text-green h-4 w-4" />
                    <h3 className="text-label text-sm font-semibold">近 12 周训练日历</h3>
                  </div>
                  <ActivityHeatmap activities={activities} className="p-0 sm:p-0" />
                </div>

                <div className="overflow-hidden">
                  <div className="mb-5 flex items-center gap-2">
                    <TrendingUp className="text-yellow h-4 w-4" />
                    <h3 className="text-label text-sm font-semibold">个人最佳</h3>
                  </div>
                  <PersonalRecords activities={activities} className="p-0 sm:p-0" />
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="activity-log" className="scroll-mt-14 px-5 py-20 sm:px-7 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="训练记录"
              title="最近活动"
              description={
                totalActivities > 0
                  ? `已显示 ${activities.length} / ${totalActivities} 条`
                  : '活动接入后会按时间显示在这里。'
              }
            />

            {error && (
              <div className="border-red/30 bg-red/5 mb-6 rounded-lg border p-5">
                <p className="text-red text-sm font-semibold">活动读取失败</p>
                <p className="text-red/75 mt-1 text-sm">{error.message}</p>
              </div>
            )}

            {activitiesLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={`activity-loading-${index}`}
                    className="bg-system-background h-24 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <ActivityTable activities={activities} virtualized={false} />
            )}

            {!activitiesLoading && hasNextPage && (
              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-blue focus-visible:outline-blue inline-flex h-11 items-center gap-2 text-sm font-semibold transition-all hover:gap-3 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowDown className={cn('h-4 w-4', isFetchingNextPage && 'animate-bounce')} />
                  <span>{isFetchingNextPage ? '正在加载' : '加载更多'}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
