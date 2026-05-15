/**
 * Home Page - Modern Activity Dashboard
 *
 * Minimalist design inspired by Apple Fitness+
 * Features: Week/Month toggle, Sparkline trends, Map layer toggle
 */

'use client'

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import type { inferRouterOutputs } from '@trpc/server'
import {
  Activity,
  ArrowDown,
  Bike,
  Calendar,
  CheckCircle2,
  Clock,
  Footprints,
  Gauge,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { useActivityStats, useInfiniteActivities, useMapRoutes } from '@/hooks/use-activities'
import { useRuntimeConfig } from '@/hooks/use-runtime-config'
import type { PublicRuntimeConfig } from '@/lib/runtime-config/types'
import { trpc } from '@/lib/trpc/client'
import type { AppRouter } from '@/lib/trpc/routers/_app'
import { cn } from '@/lib/utils'
import type { ActivityListItem } from '@/types/activity'
import type { RouteData } from '@/types/map'

// Lazy load heavy components to reduce initial bundle size
// Reason: MapLibre GL (~60KB gz) + react-map-gl should not block first paint
const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((m) => ({ default: m.RunMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse rounded-3xl bg-gray-100 sm:h-[500px] dark:bg-gray-900" />
    ),
  },
)

const RouteLayer = dynamic(() =>
  import('@/components/map/RouteLayer').then((m) => ({ default: m.RouteLayer })),
)

// Reason: Below-the-fold components don't need eager loading
const ActivityHeatmap = dynamic(() =>
  import('@/components/activity/ActivityHeatmap').then((m) => ({ default: m.ActivityHeatmap })),
)

const PersonalRecords = dynamic(() =>
  import('@/components/activity/PersonalRecords').then((m) => ({ default: m.PersonalRecords })),
)

type StatsPeriod = 'week' | 'month'
type SportType = 'running' | 'cycling'
type SyncSourceId = 'strava' | 'nike'
type TrainingFocusId = 'goals' | 'recovery' | 'routes' | 'strava' | 'nike' | 'activityLog'
type ActivityStatsData = NonNullable<ReturnType<typeof useActivityStats>['data']>
type SyncStatusData = inferRouterOutputs<AppRouter>['sync']['getSyncStatus']
type TrainingGoals = PublicRuntimeConfig['goals']

const SPORT_CONFIG = {
  running: {
    label: '跑步',
    icon: Footprints,
    badgeClassName: 'bg-blue/10 text-blue',
    sparklineColor: 'var(--color-blue)',
    routeColor: '#007aff',
  },
  cycling: {
    label: '骑行',
    icon: Bike,
    badgeClassName: 'bg-orange/10 text-orange',
    sparklineColor: 'var(--color-orange)',
    routeColor: '#ff9500',
  },
} as const

const SPORT_TYPES: SportType[] = ['running', 'cycling']

const TRAINING_FOCUS_META: Record<
  TrainingFocusId,
  {
    eyebrow: string
    title: string
    sectionId: string
    actionLabel: string
    accentClassName: string
    softClassName: string
    routeClassName: string
  }
> = {
  goals: {
    eyebrow: 'Goal check',
    title: '本周目标还差多少',
    sectionId: 'training-goals',
    actionLabel: '查看目标进度',
    accentClassName: 'bg-blue text-white',
    softClassName: 'border-blue/20 bg-blue/10 text-blue',
    routeClassName: 'from-blue via-cyan to-mint',
  },
  recovery: {
    eyebrow: 'Load review',
    title: '最近训练是否需要收一收',
    sectionId: 'training-calendar',
    actionLabel: '查看训练日历',
    accentClassName: 'bg-purple text-white',
    softClassName: 'border-purple/20 bg-purple/10 text-purple',
    routeClassName: 'from-purple via-pink to-red',
  },
  routes: {
    eyebrow: 'Route replay',
    title: '哪条路线值得复盘',
    sectionId: 'route-map',
    actionLabel: '查看路线地图',
    accentClassName: 'bg-green text-white',
    softClassName: 'border-green/20 bg-green/10 text-green',
    routeClassName: 'from-green via-mint to-teal',
  },
  strava: {
    eyebrow: 'Strava',
    title: '先接入跑步和骑行记录',
    sectionId: 'activity-log',
    actionLabel: '同步 Strava',
    accentClassName: 'bg-orange text-white',
    softClassName: 'border-orange/20 bg-orange/10 text-orange',
    routeClassName: 'from-orange via-red to-pink',
  },
  nike: {
    eyebrow: 'Nike Run Club',
    title: '同步跑步记录',
    sectionId: 'activity-log',
    actionLabel: '同步 Nike',
    accentClassName: 'bg-green text-white',
    softClassName: 'border-green/20 bg-green/10 text-green',
    routeClassName: 'from-green via-mint to-cyan',
  },
  activityLog: {
    eyebrow: 'Data check',
    title: '检查活动列表',
    sectionId: 'activity-log',
    actionLabel: '查看活动列表',
    accentClassName: 'bg-gray text-white',
    softClassName: 'border-gray/20 bg-gray/10 text-gray',
    routeClassName: 'from-gray via-blue to-cyan',
  },
}

interface ParallaxSectionProps {
  children: ReactNode
  containerRef: RefObject<HTMLElement | null>
  className?: string
  fillHeight?: boolean
  id?: string
  disableParallax?: boolean
}

function ParallaxSection({
  children,
  containerRef,
  className,
  fillHeight = false,
  id,
  disableParallax = false,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [48, 0, -48])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.99, 1, 0.99])
  const opacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0.88, 1, 1, 0.88])

  return (
    <section
      id={id}
      ref={sectionRef}
      className={cn(
        'relative z-10 min-h-[calc(100dvh-4rem)] snap-start py-6 lg:py-8',
        fillHeight && 'h-[calc(100dvh-4rem)]',
        className,
      )}
    >
      <motion.div
        style={disableParallax ? undefined : { y, scale, opacity }}
        className={cn('w-full', fillHeight && 'h-full')}
      >
        {children}
      </motion.div>
    </section>
  )
}

type TrainingFocus = {
  id: TrainingFocusId
  syncSource?: SyncSourceId
  eyebrow: string
  title: string
  summary: string
  metric: string
  metricLabel: string
  actionLabel: string
  sectionId: string
  accentClassName: string
  softClassName: string
  routeClassName: string
  evidence: Array<{
    label: string
    value: string
    width: string
    toneClassName: string
  }>
  nextSteps: Array<{
    label: string
    title: string
    detail: string
    toneClassName: string
  }>
}

function getConfiguredSources(syncStatus: SyncStatusData | undefined): SyncSourceId[] {
  const sources: SyncSourceId[] = []
  if (syncStatus?.strava?.hasCredentials) sources.push('strava')
  if (syncStatus?.nike?.hasToken) sources.push('nike')
  return sources
}

function createSyncFocus(
  source: SyncSourceId,
  syncStatus: SyncStatusData | undefined,
): TrainingFocus {
  const meta = TRAINING_FOCUS_META[source]
  const isStrava = source === 'strava'
  const sourceStatus = syncStatus?.[source]
  const configured = isStrava ? syncStatus?.strava?.hasCredentials : syncStatus?.nike?.hasToken
  const latestSync = sourceStatus?.latestSync
  const latestSyncLabel = latestSync?.completedAt
    ? formatShortDate(latestSync.completedAt)
    : latestSync?.startedAt
      ? formatShortDate(latestSync.startedAt)
      : '暂无'
  const syncedCount = latestSync?.activitiesCount ?? 0

  return {
    id: source,
    syncSource: source,
    ...meta,
    metric: configured ? '可同步' : '未配置',
    metricLabel: isStrava ? '跑步 + 骑行' : '跑步',
    actionLabel: configured ? meta.actionLabel : '查看配置状态',
    sectionId: 'activity-log',
    summary: configured
      ? `${meta.eyebrow} 凭据已就绪。先同步真实活动，首页才会生成目标缺口、负荷连续性和路线复盘。`
      : `${meta.eyebrow} 还没有配置凭据。这里不会生成假计划，会先把你带到活动列表的空状态。`,
    evidence: [
      {
        label: '凭据',
        value: configured ? '已配置' : '未配置',
        width: configured ? '100%' : '16%',
        toneClassName: configured ? 'bg-green' : 'bg-gray',
      },
      {
        label: '最近同步',
        value: latestSyncLabel,
        width: latestSync ? '72%' : '12%',
        toneClassName: 'bg-blue',
      },
      {
        label: '新增记录',
        value: `${syncedCount} 条`,
        width: `${Math.min(syncedCount * 12, 100)}%`,
        toneClassName: 'bg-orange',
      },
    ],
    nextSteps: [
      {
        label: 'Step 1',
        title: configured ? meta.actionLabel : '配置同步凭据',
        detail: configured
          ? '拉取最新活动并刷新首页数据。'
          : '在运行配置里补齐对应 token 或 OAuth 信息。',
        toneClassName: configured ? 'bg-green/10 text-green' : 'bg-gray/10 text-gray',
      },
      {
        label: 'Step 2',
        title: '刷新训练仪表盘',
        detail: '同步后自动更新目标、日历、地图和活动列表。',
        toneClassName: 'bg-blue/10 text-blue',
      },
    ],
  }
}

function buildEmptyDataFocuses(syncStatus: SyncStatusData | undefined): TrainingFocus[] {
  const configuredSources = getConfiguredSources(syncStatus)
  const sources = configuredSources.length > 0 ? configuredSources : (['strava', 'nike'] as const)
  const syncFocuses = sources.map((source) => createSyncFocus(source, syncStatus))
  const activityLogMeta = TRAINING_FOCUS_META.activityLog

  return [
    ...syncFocuses,
    {
      id: 'activityLog',
      ...activityLogMeta,
      metric: '0 条',
      metricLabel: '活动记录',
      actionLabel: activityLogMeta.actionLabel,
      sectionId: activityLogMeta.sectionId,
      summary: '当前数据库还没有活动。先确认同步结果或空状态，再回到这里看训练焦点。',
      evidence: [
        { label: '活动', value: '0 条', width: '0%', toneClassName: 'bg-gray' },
        {
          label: 'Strava',
          value: syncStatus?.strava?.hasCredentials ? '可同步' : '未配置',
          width: syncStatus?.strava?.hasCredentials ? '100%' : '12%',
          toneClassName: 'bg-orange',
        },
        {
          label: 'Nike',
          value: syncStatus?.nike?.hasToken ? '可同步' : '未配置',
          width: syncStatus?.nike?.hasToken ? '100%' : '12%',
          toneClassName: 'bg-green',
        },
      ],
      nextSteps: [
        {
          label: 'Step 1',
          title: '查看活动空状态',
          detail: '确认是没有同步，还是同步后没有新记录。',
          toneClassName: 'bg-gray/10 text-gray',
        },
        {
          label: 'Step 2',
          title: '回到训练焦点',
          detail: '有活动后首页会自动切换到目标、负荷和路线复盘。',
          toneClassName: 'bg-blue/10 text-blue',
        },
      ],
    },
  ]
}

function formatDistance(distanceMeters: number | null | undefined) {
  const kilometers = (distanceMeters ?? 0) / 1000
  return `${kilometers >= 100 ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`
}

function formatDurationHours(durationSeconds: number | null | undefined) {
  return `${((durationSeconds ?? 0) / 3600).toFixed(1)} h`
}

function formatShortDate(value: Date | string | null | undefined) {
  if (!value) return '暂无'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function progressWidth(current: number, goal: number) {
  if (!goal) return '0%'
  return `${Math.min(Math.round((current / goal) * 100), 100)}%`
}

function buildTrainingFocuses(
  stats: ActivityStatsData | undefined,
  activities: ActivityListItem[],
  routeCount: number,
  goals: TrainingGoals,
  syncStatus: SyncStatusData | undefined,
  isLoading: boolean,
): TrainingFocus[] {
  if (isLoading) {
    return (['goals', 'recovery', 'routes'] as const).map((id) => {
      const meta = TRAINING_FOCUS_META[id]

      return {
        id,
        ...meta,
        metric: '读取中',
        metricLabel: '同步数据',
        actionLabel: meta.actionLabel,
        sectionId: meta.sectionId,
        summary: '正在读取你的运动记录和目标进度，完成后这里会变成可执行的训练焦点。',
        evidence: [
          { label: '数据', value: '读取中', width: '45%', toneClassName: 'bg-blue' },
          { label: '模块', value: '待关联', width: '30%', toneClassName: 'bg-purple' },
          { label: '动作', value: '待推荐', width: '20%', toneClassName: 'bg-green' },
        ],
        nextSteps: [
          {
            label: 'Step 1',
            title: '读取活动记录',
            detail: '同步完成后会计算目标、负荷和路线焦点。',
            toneClassName: 'bg-blue/10 text-blue',
          },
          {
            label: 'Step 2',
            title: '关联页面模块',
            detail: '焦点会指向目标卡、热力图、地图或活动列表。',
            toneClassName: 'bg-green/10 text-green',
          },
        ],
      }
    })
  }

  if ((stats?.total.activities ?? activities.length) === 0) {
    return buildEmptyDataFocuses(syncStatus)
  }

  const runningWeek = stats?.byType.running.thisWeek.distance ?? 0
  const cyclingWeek = stats?.byType.cycling.thisWeek.distance ?? 0
  const runningGoal = goals.running.weeklyDistance
  const cyclingGoal = goals.cycling.weeklyDistance
  const weeklyDistance = runningWeek + cyclingWeek
  const weeklyGoal = runningGoal + cyclingGoal
  const weeklyDurationGoal = goals.running.weeklyDuration + goals.cycling.weeklyDuration
  const weeklyProgress =
    weeklyGoal > 0 ? Math.min(Math.round((weeklyDistance / weeklyGoal) * 100), 100) : 0

  const thisWeekDuration =
    (stats?.byType.running.thisWeek.duration ?? 0) + (stats?.byType.cycling.thisWeek.duration ?? 0)
  const lastWeekDuration =
    (stats?.byType.running.lastWeek.duration ?? 0) + (stats?.byType.cycling.lastWeek.duration ?? 0)
  const durationDelta =
    lastWeekDuration > 0
      ? Math.round(((thisWeekDuration - lastWeekDuration) / lastWeekDuration) * 100)
      : null
  const recentActivities = activities.slice(0, 7)
  const latestActivity = activities[0]
  const outdoorActivities = activities.filter((activity) => !activity.isIndoor)
  const longestOutdoorActivity = outdoorActivities.reduce<ActivityListItem | null>(
    (longest, activity) => (!longest || activity.distance > longest.distance ? activity : longest),
    null,
  )

  const goalMeta = TRAINING_FOCUS_META.goals
  const recoveryMeta = TRAINING_FOCUS_META.recovery
  const routeMeta = TRAINING_FOCUS_META.routes

  return [
    {
      id: 'goals',
      ...goalMeta,
      title: weeklyProgress >= 100 ? '本周目标已完成' : goalMeta.title,
      metric: `${weeklyProgress}%`,
      metricLabel: '本周目标',
      actionLabel: goalMeta.actionLabel,
      sectionId: goalMeta.sectionId,
      summary: stats
        ? weeklyProgress >= 100
          ? `本周已经完成 ${formatDistance(weeklyDistance)}，超过 ${formatDistance(weeklyGoal)} 目标。接下来更适合看负荷和恢复，而不是继续补量。`
          : `本周已经完成 ${formatDistance(weeklyDistance)}，目标是 ${formatDistance(weeklyGoal)}。先看目标进度，再决定下一次训练是补跑量、骑行通勤，还是保留恢复。`
        : '同步活动后，这里会把本周目标缺口直接指向下面的目标进度卡。',
      evidence: [
        {
          label: '跑步',
          value: `${formatDistance(runningWeek)} / ${formatDistance(runningGoal)}`,
          width: progressWidth(runningWeek, runningGoal),
          toneClassName: 'bg-blue',
        },
        {
          label: '骑行',
          value: `${formatDistance(cyclingWeek)} / ${formatDistance(cyclingGoal)}`,
          width: progressWidth(cyclingWeek, cyclingGoal),
          toneClassName: 'bg-orange',
        },
        {
          label: '总进度',
          value: `${weeklyProgress}%`,
          width: `${weeklyProgress}%`,
          toneClassName: weeklyProgress >= 80 ? 'bg-green' : 'bg-blue',
        },
      ],
      nextSteps: [
        {
          label: 'Step 1',
          title: '查看本周目标卡',
          detail: '确认距离和时长两个目标哪个更缺。',
          toneClassName: 'bg-blue/10 text-blue',
        },
        {
          label: 'Step 2',
          title: '再看活动列表',
          detail: '用最近一次训练决定下一次补量方式。',
          toneClassName: 'bg-green/10 text-green',
        },
      ],
    },
    {
      id: 'recovery',
      ...recoveryMeta,
      metric:
        durationDelta === null
          ? formatDurationHours(thisWeekDuration)
          : `${durationDelta >= 0 ? '+' : ''}${durationDelta}%`,
      metricLabel: durationDelta === null ? '本周时长' : '较上周负荷',
      actionLabel: activities.length > 0 ? recoveryMeta.actionLabel : '查看活动列表',
      sectionId: activities.length > 0 ? recoveryMeta.sectionId : 'activity-log',
      summary:
        durationDelta === null
          ? `本周已有 ${formatDurationHours(thisWeekDuration)} 训练时长。先看训练日历的连续性，再判断今天该训练还是恢复。`
          : `本周训练时长 ${formatDurationHours(thisWeekDuration)}，较上周 ${durationDelta >= 0 ? '增加' : '减少'} ${Math.abs(durationDelta)}%。先看训练连续性，再判断今天该继续训练还是主动恢复。`,
      evidence: [
        {
          label: '本周',
          value: formatDurationHours(thisWeekDuration),
          width: progressWidth(thisWeekDuration, weeklyDurationGoal),
          toneClassName: 'bg-purple',
        },
        {
          label: '上周',
          value: formatDurationHours(lastWeekDuration),
          width: progressWidth(lastWeekDuration, weeklyDurationGoal),
          toneClassName: 'bg-pink',
        },
        {
          label: '最近记录',
          value: `${recentActivities.length} 次`,
          width: `${Math.min(recentActivities.length * 14, 100)}%`,
          toneClassName: 'bg-red',
        },
      ],
      nextSteps: [
        {
          label: 'Step 1',
          title: '看热力图连续性',
          detail: '确认最近是否连续高频训练。',
          toneClassName: 'bg-purple/10 text-purple',
        },
        {
          label: 'Step 2',
          title: latestActivity?.title || '打开最近活动',
          detail: `${formatShortDate(latestActivity?.startTime)} · ${formatDistance(latestActivity?.distance)}`,
          toneClassName: 'bg-pink/10 text-pink',
        },
      ],
    },
    {
      id: 'routes',
      ...routeMeta,
      metric: `${routeCount}`,
      metricLabel: '可复盘路线',
      actionLabel: routeCount > 0 ? routeMeta.actionLabel : '查看活动列表',
      sectionId: routeCount > 0 ? routeMeta.sectionId : 'activity-log',
      summary:
        routeCount > 0
          ? `当前地图有 ${routeCount} 条路线可复盘。先看路线分布，再从活动列表打开值得分析的那一次。`
          : '还没有可展示路线。先从活动列表里检查是否同步了户外 GPS 记录。',
      evidence: [
        {
          label: '地图路线',
          value: `${routeCount} 条`,
          width: `${Math.min(routeCount * 8, 100)}%`,
          toneClassName: 'bg-green',
        },
        {
          label: '最长户外',
          value: formatDistance(longestOutdoorActivity?.distance),
          width: `${Math.min(((longestOutdoorActivity?.distance ?? 0) / 50000) * 100, 100)}%`,
          toneClassName: 'bg-mint',
        },
        {
          label: '最近户外',
          value: formatShortDate(outdoorActivities[0]?.startTime),
          width: outdoorActivities.length > 0 ? '72%' : '0%',
          toneClassName: 'bg-teal',
        },
      ],
      nextSteps: [
        {
          label: 'Step 1',
          title: '打开路线地图',
          detail: '先看路线分布，再决定要复盘哪次活动。',
          toneClassName: 'bg-green/10 text-green',
        },
        {
          label: 'Step 2',
          title: longestOutdoorActivity?.title || '查看户外活动',
          detail: `${formatShortDate(longestOutdoorActivity?.startTime)} · ${formatDistance(longestOutdoorActivity?.distance)}`,
          toneClassName: 'bg-teal/10 text-teal',
        },
      ],
    },
  ]
}

function TrainingFocusHero({
  activities,
  goals,
  isLoading,
  routeCount,
  stats,
  syncStatus,
}: {
  activities: ActivityListItem[]
  goals: TrainingGoals
  isLoading: boolean
  routeCount: number
  stats: ActivityStatsData | undefined
  syncStatus: SyncStatusData | undefined
}) {
  const utils = trpc.useUtils()
  const [selectedId, setSelectedId] = useState<TrainingFocusId>('goals')
  const hasUserSelectedFocus = useRef(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const syncStrava = trpc.sync.syncStrava.useMutation()
  const syncNike = trpc.sync.syncNike.useMutation()
  const isSyncing = syncStrava.isPending || syncNike.isPending
  const focuses = useMemo(
    () => buildTrainingFocuses(stats, activities, routeCount, goals, syncStatus, isLoading),
    [activities, goals, isLoading, routeCount, stats, syncStatus],
  )
  const recommendedFocusId = useMemo<TrainingFocusId>(() => {
    if (isLoading) return 'goals'
    if ((stats?.total.activities ?? activities.length) === 0) {
      return getConfiguredSources(syncStatus)[0] ?? 'activityLog'
    }

    const goalFocus = focuses.find((item) => item.id === 'goals')
    const recoveryFocus = focuses.find((item) => item.id === 'recovery')
    const routeFocus = focuses.find((item) => item.id === 'routes')
    const goalProgress = Number.parseFloat(goalFocus?.metric ?? '0')
    const loadDelta = Number.parseFloat(recoveryFocus?.metric ?? '0')
    const routesAvailable = Number.parseInt(routeFocus?.metric ?? '0', 10)

    if (loadDelta >= 30) return 'recovery'
    if (goalProgress < 100) return 'goals'
    if (routesAvailable > 0) return 'routes'
    return 'recovery'
  }, [activities.length, focuses, isLoading, stats, syncStatus])

  useEffect(() => {
    if (!hasUserSelectedFocus.current) {
      setSelectedId(recommendedFocusId)
    }
  }, [recommendedFocusId])

  const focus = focuses.find((item) => item.id === selectedId) ?? focuses[0]

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const refreshDashboardData = useCallback(async () => {
    await Promise.all([
      utils.activities.getStats.invalidate(),
      utils.activities.list.invalidate(),
      utils.activities.getMapRoutes.invalidate(),
      utils.sync.getSyncStatus.invalidate(),
    ])
  }, [utils])

  const handlePrimaryAction = useCallback(async () => {
    if (focus.syncSource) {
      const source = focus.syncSource
      const configured =
        source === 'strava' ? syncStatus?.strava?.hasCredentials : syncStatus?.nike?.hasToken

      if (!configured) {
        setSyncMessage(`${focus.eyebrow} 还没有配置凭据，先在运行配置中补齐后再同步。`)
        scrollToSection('activity-log')
        return
      }

      setSyncMessage(`${focus.eyebrow} 正在同步...`)
      try {
        const result =
          source === 'strava'
            ? await syncStrava.mutateAsync({ limit: 50 })
            : await syncNike.mutateAsync({ limit: 50 })
        setSyncMessage(`${focus.eyebrow} 已同步 ${result.count} 条活动，仪表盘已刷新。`)
        await refreshDashboardData()
        scrollToSection('activity-log')
      } catch (error) {
        setSyncMessage(error instanceof Error ? error.message : `${focus.eyebrow} 同步失败`)
      }
      return
    }

    scrollToSection(focus.sectionId)
  }, [focus, refreshDashboardData, scrollToSection, syncNike, syncStatus, syncStrava])

  const isEmptyDashboard = !isLoading && (stats?.total.activities ?? activities.length) === 0
  const HeroActionIcon = focus.syncSource
    ? RefreshCw
    : focus.id === 'activityLog'
      ? ArrowDown
      : TrendingUp
  const FocusIcon = focus.syncSource
    ? RefreshCw
    : focus.id === 'activityLog'
      ? ArrowDown
      : Footprints

  return (
    <section className="relative z-10 flex min-h-[calc(100dvh-4rem)] snap-start items-center py-4 lg:py-5">
      <div className="grid w-full gap-5 lg:grid-cols-2 lg:items-center xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <div className="border-separator/50 text-secondary-label inline-flex items-center gap-2 rounded-full border bg-white/65 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-xl dark:bg-white/8">
            <Sparkles className="text-blue h-3.5 w-3.5" />
            {isEmptyDashboard ? '数据接入' : '训练焦点'}
          </div>
          <div className="max-w-xl space-y-3">
            <h2 className="text-label text-5xl leading-[1.04] font-semibold tracking-normal text-balance sm:text-6xl lg:text-[4rem]">
              {isEmptyDashboard ? '先把真实记录接进来。' : '先决定今天该看什么。'}
            </h2>
            <p className="text-secondary-label max-w-lg text-base leading-7">
              {isEmptyDashboard
                ? 'RunPaceFlow 的目标、负荷和路线复盘都来自真实活动。先同步 Strava 或 Nike，随后这里会自动变成训练焦点。'
                : 'RunPaceFlow 会把已有运动记录整理成今日训练焦点：目标缺口、负荷连续性和路线复盘都能直接跳到对应模块。'}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {focuses.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={selectedId === item.id}
                onClick={() => {
                  hasUserSelectedFocus.current = true
                  setSelectedId(item.id)
                }}
                className={cn(
                  'group border-separator/45 bg-secondary-system-background/70 hover:bg-tertiary-system-background/80 relative overflow-hidden rounded-lg border p-3 text-left shadow-sm backdrop-blur-xl transition-all',
                  selectedId === item.id &&
                    'border-label/20 bg-tertiary-system-background shadow-md',
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-normal',
                      item.softClassName,
                    )}
                  >
                    {item.eyebrow}
                  </span>
                  <span className="text-tertiary-label text-xs tabular-nums">{item.metric}</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-label text-sm font-semibold">{item.title}</p>
                  <p className="text-secondary-label line-clamp-1 text-xs leading-5">
                    {item.summary}
                  </p>
                </div>
                {selectedId === item.id && (
                  <motion.div
                    layoutId="onboarding-card-indicator"
                    className="bg-label absolute right-3 bottom-3 h-1.5 w-8 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={focus.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.24 }}
            className="border-separator/50 grid overflow-hidden rounded-lg border bg-white/78 shadow-sm backdrop-blur-2xl dark:bg-white/8"
          >
            <div className="border-separator/50 relative overflow-hidden border-b p-5 sm:p-6">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(var(--color-label) 1px, transparent 1px), linear-gradient(90deg, var(--color-label) 1px, transparent 1px)',
                  backgroundSize: '42px 42px',
                }}
              />
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0 h-28 bg-gradient-to-r opacity-20 blur-2xl',
                  focus.routeClassName,
                )}
              />

              <div className="relative flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          focus.accentClassName,
                        )}
                      >
                        <FocusIcon
                          className={cn('h-4 w-4', focus.syncSource && isSyncing && 'animate-spin')}
                        />
                      </span>
                      <span className="text-label text-sm font-semibold">
                        {focus.syncSource ? 'RunPaceFlow Sync' : 'RunPaceFlow Focus'}
                      </span>
                    </div>
                    <h3 className="text-label max-w-2xl text-3xl leading-tight font-semibold tracking-normal sm:text-4xl">
                      {focus.title}
                    </h3>
                  </div>
                  <span className="text-tertiary-label hidden text-right font-mono text-xs uppercase sm:block">
                    Today
                    <br />
                    Focus
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.72fr_1fr]">
                  <div className="border-separator/60 bg-system-background/72 rounded-lg border p-4 shadow-sm backdrop-blur">
                    <div className="text-tertiary-label mb-6 flex items-center justify-between text-xs">
                      <span>当前焦点</span>
                      <span>{focus.metricLabel}</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-label text-4xl font-semibold">{focus.metric}</span>
                      <span className="text-secondary-label pb-1 text-sm">{focus.metricLabel}</span>
                    </div>
                    <p className="text-secondary-label mt-4 text-sm leading-6">{focus.summary}</p>
                  </div>

                  <div className="border-separator/60 bg-system-background/72 rounded-lg border p-4 shadow-sm backdrop-blur">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-label text-sm font-semibold">接下来可做</span>
                      <Gauge className="text-tertiary-label h-4 w-4" />
                    </div>
                    <div className="space-y-3">
                      {focus.nextSteps.map((step) => (
                        <div
                          key={`${focus.id}-${step.label}`}
                          className="grid grid-cols-[3.5rem_1fr] gap-3"
                        >
                          <div
                            className={cn(
                              'flex h-10 items-center justify-center rounded-lg text-xs font-semibold',
                              step.toneClassName,
                            )}
                          >
                            {step.label}
                          </div>
                          <div className="min-w-0">
                            <p className="text-label truncate text-sm font-medium">{step.title}</p>
                            <p className="text-secondary-label truncate text-xs">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-separator/60 bg-system-background/72 relative h-20 overflow-hidden rounded-lg border shadow-sm backdrop-blur">
                  <svg
                    viewBox="0 0 720 112"
                    role="img"
                    aria-label="训练负荷预览曲线"
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id={`route-${focus.id}`} x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                        <stop offset="48%" stopColor="currentColor" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M24 76 C96 18 142 96 208 55 C286 7 328 102 398 58 C470 13 526 36 582 64 C632 89 670 66 696 34"
                      fill="none"
                      stroke={`url(#route-${focus.id})`}
                      strokeWidth="9"
                      strokeLinecap="round"
                      className={cn(
                        focus.id === 'goals' && 'text-blue',
                        focus.id === 'routes' && 'text-green',
                        focus.id === 'recovery' && 'text-purple',
                        focus.id === 'strava' && 'text-orange',
                        focus.id === 'nike' && 'text-green',
                        focus.id === 'activityLog' && 'text-gray',
                      )}
                    />
                    {[96, 208, 398, 582, 696].map((x, index) => (
                      <circle
                        key={`${focus.id}-point-${x}`}
                        cx={x}
                        cy={[36, 55, 58, 64, 34][index]}
                        r="7"
                        className="fill-system-background stroke-label/30"
                        strokeWidth="3"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            <aside className="bg-secondary-system-background/62 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-tertiary-label text-xs font-semibold tracking-normal uppercase">
                    关联模块
                  </p>
                  <h3 className="text-label mt-1 text-2xl font-semibold">{focus.actionLabel}</h3>
                </div>
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    focus.softClassName,
                  )}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {focus.evidence.map((item) => (
                  <div
                    key={`${focus.id}-${item.label}`}
                    className="border-separator/55 bg-system-background/75 rounded-lg border p-3"
                  >
                    <p className="text-tertiary-label text-[11px]">{item.label}</p>
                    <p className="text-label mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {focus.evidence.map((checkpoint) => (
                  <div key={`${focus.id}-bar-${checkpoint.label}`}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-secondary-label">{checkpoint.label}</span>
                      <span className="text-label font-medium">{checkpoint.value}</span>
                    </div>
                    <div className="bg-quaternary-fill h-2 overflow-hidden rounded-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: checkpoint.width }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', checkpoint.toneClassName)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-separator/55 bg-system-background/75 mt-4 rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <HeroActionIcon
                    className={cn(
                      'text-blue h-4 w-4',
                      focus.syncSource && isSyncing && 'animate-spin',
                    )}
                  />
                  <span className="text-label text-sm font-semibold">下一步</span>
                </div>
                <p className="text-secondary-label text-sm leading-6">
                  {focus.syncSource
                    ? '同步完成后会刷新目标、日历、地图和活动列表，训练焦点会基于新数据重新推荐。'
                    : focus.id === 'activityLog'
                      ? '先检查活动空状态；有活动后这里会自动切换成训练复盘入口。'
                      : '选择焦点后继续查看目标、日历、路线或活动明细，形成完整的复盘路径。'}
                </p>
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={!!focus.syncSource && isSyncing}
                  className="bg-label text-system-background mt-4 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {focus.syncSource && isSyncing ? '同步中...' : focus.actionLabel}
                </button>
                {syncMessage && (
                  <p className="text-secondary-label mt-3 text-xs leading-5">{syncMessage}</p>
                )}
              </div>
            </aside>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

export default function HomePage() {
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
  const { data: syncStatus, isLoading: syncStatusLoading } = trpc.sync.getSyncStatus.useQuery()

  // UI state
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('week')
  const mainRef = useRef<HTMLElement | null>(null)
  const activityScrollRef = useRef<HTMLDivElement | null>(null)

  const activities = useMemo(
    () => activitiesPages?.pages.flatMap((page) => page.activities) ?? [],
    [activitiesPages],
  )
  const totalActivities = activitiesPages?.pages[0]?.pagination.total ?? activities.length

  const handleActivityScroll = useCallback(() => {
    const el = activityScrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    if (remaining < 320) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Map routes are pre-parsed on server (coordinates extracted from GPX)
  const { routes, bounds } = useMemo(() => {
    if (!mapRoutesData || mapRoutesData.length === 0) return { routes: [], bounds: null }

    const parsedRoutes: RouteData[] = mapRoutesData
      .map((item) => ({
        id: item.id,
        coordinates: item.coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng })),
        color:
          item.type === 'cycling'
            ? SPORT_CONFIG.cycling.routeColor
            : SPORT_CONFIG.running.routeColor,
        width: item.type === 'cycling' ? 4 : 3,
      }))
      .filter((route) => route.coordinates.length > 0)

    if (parsedRoutes.length === 0) return { routes: parsedRoutes, bounds: null }

    const allCoords = parsedRoutes.flatMap((route) => route.coordinates)
    if (allCoords.length === 0) return { routes: parsedRoutes, bounds: null }

    const lats = allCoords.map((c) => c.latitude)
    const lons = allCoords.map((c) => c.longitude)

    return {
      routes: parsedRoutes,
      bounds: {
        minLng: Math.min(...lons),
        maxLng: Math.max(...lons),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      },
    }
  }, [mapRoutesData])

  const sportStats = stats
    ? SPORT_TYPES.map((type) => {
        const periodLabel = statsPeriod === 'week' ? '本周' : '本月'
        const compareLabel = statsPeriod === 'week' ? 'vs 上周' : 'vs 上月'
        const data = stats.byType[type]
        const goals = runtimeConfig.goals[type] ?? runtimeConfig.goals.running
        const config = SPORT_CONFIG[type]
        const current = statsPeriod === 'week' ? data.thisWeek : data.thisMonth
        const previous = statsPeriod === 'week' ? data.lastWeek : data.lastMonth

        return {
          type,
          ...config,
          data,
          goals,
          current,
          previous,
          periodLabel,
          compareLabel,
        }
      })
    : null

  return (
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <Header />

      <main
        ref={mainRef}
        className="scrollbar-hide relative container mx-auto h-[calc(100dvh-4rem)] max-w-6xl snap-y snap-mandatory overflow-y-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Decorative hollow "run" mark on the right background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-32 right-[1.5rem] z-0 text-[clamp(8rem,27vw,24rem)] leading-none font-black tracking-[-0.08em] text-transparent lowercase opacity-50 select-none [-webkit-text-stroke:2.6px_rgba(17,24,39,0.08)] dark:opacity-40 dark:[-webkit-text-stroke:2.6px_rgba(255,255,255,0.12)]"
        >
          run
        </div>

        <TrainingFocusHero
          activities={activities}
          goals={runtimeConfig.goals}
          isLoading={statsLoading || activitiesLoading || mapRoutesLoading || syncStatusLoading}
          routeCount={routes.length}
          stats={stats}
          syncStatus={syncStatus}
        />

        {/* Stats Section with Period Toggle */}
        <ParallaxSection id="training-goals" containerRef={mainRef} className="flex items-center">
          {/* Period Toggle */}
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-transparent p-1">
              {(['week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setStatsPeriod(period)}
                  className={cn(
                    'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    statsPeriod === period ? 'text-label' : 'text-label/50 hover:text-label/70',
                  )}
                >
                  {statsPeriod === period && (
                    <motion.div
                      layoutId="stats-period-indicator"
                      className="border-label/15 absolute inset-0 rounded-md border bg-transparent"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{period === 'week' ? '本周' : '本月'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={`stats-skeleton-${i}`}
                  className="bg-secondary-system-background/50 h-32 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : sportStats ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={statsPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {sportStats.map((sport) => {
                  const SportIcon = sport.icon
                  const distanceGoal =
                    statsPeriod === 'week'
                      ? sport.goals.weeklyDistance
                      : sport.goals.monthlyDistance
                  const durationGoal =
                    statsPeriod === 'week'
                      ? sport.goals.weeklyDuration
                      : sport.goals.monthlyDuration

                  return (
                    <div key={sport.type}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-7 w-7 items-center justify-center rounded-full',
                              sport.badgeClassName,
                            )}
                          >
                            <SportIcon className="h-4 w-4" />
                          </span>
                          <h3 className="text-label text-sm font-medium">{sport.label}</h3>
                        </div>
                        <span className="text-tertiary-label text-xs tabular-nums">
                          累计 {(sport.data.total.distance / 1000).toFixed(1)} km
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatsCard
                          title="总里程"
                          value={(sport.data.total.distance / 1000).toFixed(1)}
                          unit="km"
                          icon={<MapPin className="h-4 w-4" />}
                        />
                        <StatsCard
                          title="活动次数"
                          value={sport.data.total.activities}
                          unit="次"
                          icon={<Activity className="h-4 w-4" />}
                        />
                        <StatsCard
                          title={`${sport.periodLabel}里程`}
                          value={(sport.current.distance / 1000).toFixed(1)}
                          unit="km"
                          icon={<Calendar className="h-4 w-4" />}
                          currentValue={sport.current.distance}
                          previousValue={sport.previous.distance}
                          higherIsBetter={true}
                          goal={distanceGoal}
                          goalDisplayValue={distanceGoal / 1000}
                          goalUnit="km"
                          subtitle={sport.compareLabel}
                          sparklineData={sport.data.weeklyTrend}
                          sparklineColor={sport.sparklineColor}
                        />
                        <StatsCard
                          title={`${sport.periodLabel}时长`}
                          value={(sport.current.duration / 3600).toFixed(1)}
                          unit="小时"
                          icon={<Clock className="h-4 w-4" />}
                          currentValue={sport.current.duration}
                          previousValue={sport.previous.duration}
                          higherIsBetter={true}
                          goal={durationGoal}
                          goalDisplayValue={durationGoal / 3600}
                          goalUnit="小时"
                          subtitle={sport.compareLabel}
                        />
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </ParallaxSection>

        {/* Map Section with Layer Toggle */}
        <ParallaxSection id="route-map" containerRef={mainRef}>
          <div className="mb-3 flex items-center justify-end">
            <span className="text-tertiary-label text-sm">
              {routes.length > 0 ? `${routes.length} 条路线` : '暂无路线数据'}
            </span>
          </div>
          <div className="border-separator/30 relative overflow-hidden rounded-3xl border bg-gray-100 shadow-sm dark:bg-gray-900">
            <div className="h-[400px] sm:h-[500px]">
              <RunMap
                className="h-full w-full"
                bounds={bounds || undefined}
                mapStyleUrl={runtimeConfig.mapStyle}
              >
                {routes.length > 0 && <RouteLayer routes={routes} />}
              </RunMap>
            </div>
          </div>
          <div className="text-label/50 mt-3 flex items-center justify-end gap-4 text-xs">
            {SPORT_TYPES.map((type) => (
              <div key={`route-legend-${type}`} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: SPORT_CONFIG[type].routeColor }}
                  aria-hidden="true"
                />
                <span>{SPORT_CONFIG[type].label}</span>
              </div>
            ))}
          </div>
        </ParallaxSection>

        {/* Activity Heatmap */}
        {activities.length > 0 && (
          <ParallaxSection
            id="training-calendar"
            containerRef={mainRef}
            className="flex items-center"
          >
            <ActivityHeatmap activities={activities} />
          </ParallaxSection>
        )}

        {/* Personal Records */}
        {activities.length > 0 && (
          <ParallaxSection containerRef={mainRef} className="flex items-center">
            <PersonalRecords activities={activities} />
          </ParallaxSection>
        )}

        {/* Activities Section */}
        <ParallaxSection
          id="activity-log"
          containerRef={mainRef}
          className="flex items-start py-0 lg:py-0"
          fillHeight={true}
          disableParallax={true}
        >
          <div className="relative h-full min-h-0 w-full">
            <div
              ref={activityScrollRef}
              className="scrollbar-hide h-full overflow-y-auto"
              onScroll={handleActivityScroll}
            >
              <div className="bg-system-background/70 sticky top-0 z-30 mb-3 flex h-11 items-center justify-end backdrop-blur-sm">
                {totalActivities > 0 && (
                  <span className="bg-secondary-system-background text-secondary-label rounded-full px-3 py-1 text-xs font-medium">
                    {activities.length} / {totalActivities}
                  </span>
                )}
              </div>

              <div
                aria-hidden="true"
                className="from-system-background/95 pointer-events-none sticky top-11 z-20 -mt-10 h-10 bg-gradient-to-b to-transparent"
              />

              {/* Error State */}
              {error && (
                <div className="border-red/20 bg-red/5 mb-6 rounded-2xl border p-6">
                  <p className="text-red font-medium">加载失败</p>
                  <p className="text-red/70 mt-1 text-sm">{error.message}</p>
                </div>
              )}

              {/* Loading State */}
              {activitiesLoading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={`activity-skeleton-${i}`}
                      className="bg-secondary-system-background/50 h-24 animate-pulse rounded-2xl"
                    />
                  ))}
                </div>
              )}

              {/* Activities Table */}
              {!activitiesLoading && (
                <ActivityTable
                  activities={activities}
                  className="relative z-10"
                  virtualized={true}
                  scrollRef={activityScrollRef}
                />
              )}

              {!activitiesLoading && isFetchingNextPage && (
                <div className="text-secondary-label/70 mb-4 flex items-center justify-center text-xs">
                  加载更多...
                </div>
              )}

              <div
                aria-hidden="true"
                className="from-system-background/95 pointer-events-none sticky bottom-0 z-20 -mt-14 h-14 bg-gradient-to-t to-transparent"
              />
            </div>
          </div>
        </ParallaxSection>
      </main>
    </div>
  )
}
