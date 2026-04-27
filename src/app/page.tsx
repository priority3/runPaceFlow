/**
 * Home Page - Modern Activity Dashboard
 *
 * Minimalist design inspired by Apple Fitness+
 * Features: Week/Month toggle, Sparkline trends, Map layer toggle
 */

'use client'

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { Activity, Bike, Calendar, Clock, Footprints, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReactNode, RefObject } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { useActivityStats, useInfiniteActivities, useMapRoutes } from '@/hooks/use-activities'
import { cn } from '@/lib/utils'
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

// 目标配置（从环境变量读取，带默认值）
const GOALS: Record<
  SportType,
  {
    weeklyDistance: number
    monthlyDistance: number
    weeklyDuration: number
    monthlyDuration: number
  }
> = {
  running: {
    weeklyDistance:
      Number(process.env.NEXT_PUBLIC_WEEKLY_RUNNING_DISTANCE_GOAL) ||
      Number(process.env.NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL) ||
      10000,
    monthlyDistance:
      Number(process.env.NEXT_PUBLIC_MONTHLY_RUNNING_DISTANCE_GOAL) ||
      Number(process.env.NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL) ||
      50000,
    weeklyDuration:
      Number(process.env.NEXT_PUBLIC_WEEKLY_RUNNING_DURATION_GOAL) ||
      Number(process.env.NEXT_PUBLIC_WEEKLY_DURATION_GOAL) ||
      3600,
    monthlyDuration:
      Number(process.env.NEXT_PUBLIC_MONTHLY_RUNNING_DURATION_GOAL) ||
      Number(process.env.NEXT_PUBLIC_MONTHLY_DURATION_GOAL) ||
      18000,
  },
  cycling: {
    weeklyDistance: Number(process.env.NEXT_PUBLIC_WEEKLY_CYCLING_DISTANCE_GOAL) || 40000,
    monthlyDistance: Number(process.env.NEXT_PUBLIC_MONTHLY_CYCLING_DISTANCE_GOAL) || 160000,
    weeklyDuration: Number(process.env.NEXT_PUBLIC_WEEKLY_CYCLING_DURATION_GOAL) || 7200,
    monthlyDuration: Number(process.env.NEXT_PUBLIC_MONTHLY_CYCLING_DURATION_GOAL) || 28800,
  },
}

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

interface ParallaxSectionProps {
  children: ReactNode
  containerRef: RefObject<HTMLElement | null>
  className?: string
  fillHeight?: boolean
  disableParallax?: boolean
}

function ParallaxSection({
  children,
  containerRef,
  className,
  fillHeight = false,
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

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const {
    data: activitiesPages,
    isLoading: activitiesLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteActivities({ limit: 20 })
  const { data: mapRoutesData } = useMapRoutes(20)

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
        const goals = GOALS[type]
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

        {/* Stats Section with Period Toggle */}
        <ParallaxSection containerRef={mainRef} className="flex items-center">
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
        <ParallaxSection containerRef={mainRef}>
          <div className="mb-3 flex items-center justify-end">
            <span className="text-tertiary-label text-sm">
              {routes.length > 0 ? `${routes.length} 条路线` : '暂无路线数据'}
            </span>
          </div>
          <div className="border-separator/30 relative overflow-hidden rounded-3xl border bg-gray-100 shadow-sm dark:bg-gray-900">
            <div className="h-[400px] sm:h-[500px]">
              <RunMap className="h-full w-full" bounds={bounds || undefined}>
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
          <ParallaxSection containerRef={mainRef} className="flex items-center">
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
