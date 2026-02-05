/**
 * Home Page - Modern Activity Dashboard
 *
 * Minimalist design inspired by Apple Fitness+
 * Features: Week/Month toggle, Sparkline trends, Map layer toggle
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Calendar, Clock, Layers, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { useActivities, useActivityStats } from '@/hooks/use-activities'
import { parsePaceSegments } from '@/lib/map/pace-utils'
import { cn } from '@/lib/utils'
import type { Activity as ActivityType } from '@/types/activity'
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

const PaceRouteLayer = dynamic(() =>
  import('@/components/map/PaceRouteLayer').then((m) => ({ default: m.PaceRouteLayer })),
)

// Reason: Below-the-fold components don't need eager loading
const ActivityHeatmap = dynamic(() =>
  import('@/components/activity/ActivityHeatmap').then((m) => ({ default: m.ActivityHeatmap })),
)

const PersonalRecords = dynamic(() =>
  import('@/components/activity/PersonalRecords').then((m) => ({ default: m.PersonalRecords })),
)

type StatsPeriod = 'week' | 'month'
type MapLayerMode = 'route' | 'pace'

// 目标配置（从环境变量读取，带默认值）
const GOALS = {
  weeklyDistance: Number(process.env.NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL) || 10000,
  monthlyDistance: Number(process.env.NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL) || 50000,
  weeklyDuration: Number(process.env.NEXT_PUBLIC_WEEKLY_DURATION_GOAL) || 3600,
  monthlyDuration: Number(process.env.NEXT_PUBLIC_MONTHLY_DURATION_GOAL) || 18000,
}

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const { data: activitiesData, isLoading: activitiesLoading, error } = useActivities({ limit: 20 })

  // UI state
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('week')
  const [mapLayerMode, setMapLayerMode] = useState<MapLayerMode>('route')

  // Parse GPX data to routes and calculate bounds for map display
  const { routes, bounds, paceSegments } = useMemo(() => {
    if (!activitiesData?.activities) return { routes: [], bounds: null, paceSegments: [] }

    const parsedRoutes = activitiesData.activities
      .filter((activity: ActivityType) => activity.gpxData)
      .map((activity: ActivityType) => ({
        id: activity.id,
        coordinates: parseGPXCoordinates(activity.gpxData || ''),
        color: '#1f2937',
        width: 3,
      }))
      .filter((route: RouteData) => route.coordinates.length > 0)

    // Calculate bounds from all routes
    if (parsedRoutes.length === 0) return { routes: parsedRoutes, bounds: null, paceSegments: [] }

    const allCoords = parsedRoutes.flatMap((route) => route.coordinates)
    if (allCoords.length === 0) return { routes: parsedRoutes, bounds: null, paceSegments: [] }

    const lats = allCoords.map((c) => c.latitude)
    const lons = allCoords.map((c) => c.longitude)

    // Parse pace segments for the first activity with GPX data
    const firstActivityWithGpx = activitiesData.activities.find(
      (a: ActivityType) => a.gpxData && a.gpxData.length > 0,
    )
    const segments = firstActivityWithGpx
      ? parsePaceSegments(firstActivityWithGpx.gpxData || '', firstActivityWithGpx.averagePace || 0)
      : []

    return {
      routes: parsedRoutes,
      bounds: {
        minLng: Math.min(...lons),
        maxLng: Math.max(...lons),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      },
      paceSegments: segments,
    }
  }, [activitiesData])

  // Get period-specific stats
  const periodStats = useMemo(() => {
    if (!stats) return null

    if (statsPeriod === 'week') {
      return {
        current: stats.thisWeek,
        previous: stats.lastWeek,
        label: '本周',
        compareLabel: 'vs 上周',
      }
    }
    return {
      current: stats.thisMonth,
      previous: stats.lastMonth,
      label: '本月',
      compareLabel: 'vs 上月',
    }
  }, [stats, statsPeriod])

  return (
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <Header />

      <main className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Stats Section with Period Toggle */}
        <section className="mb-12">
          {/* Period Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-label text-xl font-semibold">数据概览</h2>
            <div className="flex items-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
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
                      className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-white/10"
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
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`stats-skeleton-${i}`}
                  className="bg-secondary-system-background/50 h-32 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : stats && periodStats ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={statsPeriod}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-4 lg:grid-cols-4"
              >
                <StatsCard
                  title="总里程"
                  value={(stats.total.distance / 1000).toFixed(1)}
                  unit="km"
                  icon={<MapPin className="h-4 w-4" />}
                />
                <StatsCard
                  title="活动次数"
                  value={stats.total.activities}
                  unit="次"
                  icon={<Activity className="h-4 w-4" />}
                />
                <StatsCard
                  title={`${periodStats.label}里程`}
                  value={(periodStats.current.distance / 1000).toFixed(1)}
                  unit="km"
                  icon={<Calendar className="h-4 w-4" />}
                  currentValue={periodStats.current.distance}
                  previousValue={periodStats.previous.distance}
                  higherIsBetter={true}
                  goal={statsPeriod === 'week' ? GOALS.weeklyDistance : GOALS.monthlyDistance}
                  goalDisplayValue={
                    statsPeriod === 'week'
                      ? GOALS.weeklyDistance / 1000
                      : GOALS.monthlyDistance / 1000
                  }
                  goalUnit="km"
                  subtitle={periodStats.compareLabel}
                  sparklineData={stats.weeklyTrend}
                />
                <StatsCard
                  title={`${periodStats.label}时长`}
                  value={(periodStats.current.duration / 3600).toFixed(1)}
                  unit="小时"
                  icon={<Clock className="h-4 w-4" />}
                  currentValue={periodStats.current.duration}
                  previousValue={periodStats.previous.duration}
                  higherIsBetter={true}
                  goal={statsPeriod === 'week' ? GOALS.weeklyDuration : GOALS.monthlyDuration}
                  goalDisplayValue={
                    statsPeriod === 'week'
                      ? GOALS.weeklyDuration / 3600
                      : GOALS.monthlyDuration / 3600
                  }
                  goalUnit="小时"
                  subtitle={periodStats.compareLabel}
                />
              </motion.div>
            </AnimatePresence>
          ) : null}
        </section>

        {/* Map Section with Layer Toggle */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-label text-xl font-semibold">路线地图</h2>
            <div className="flex items-center gap-3">
              <span className="text-tertiary-label text-sm">
                {routes.length > 0 ? `${routes.length} 条路线` : '暂无路线数据'}
              </span>

              {/* Layer Toggle */}
              {routes.length > 0 && paceSegments.length > 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
                  {(['route', 'pace'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMapLayerMode(mode)}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                        mapLayerMode === mode ? 'text-label' : 'text-label/50 hover:text-label/70',
                      )}
                    >
                      {mapLayerMode === mode && (
                        <motion.div
                          layoutId="map-layer-indicator"
                          className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-white/10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <Layers className="relative z-10 h-3.5 w-3.5" />
                      <span className="relative z-10">{mode === 'route' ? '路线' : '配速'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="border-separator/30 relative overflow-hidden rounded-3xl border bg-gray-100 shadow-sm dark:bg-gray-900">
            <div className="h-[400px] sm:h-[500px]">
              <RunMap className="h-full w-full" bounds={bounds || undefined}>
                <AnimatePresence mode="wait">
                  {mapLayerMode === 'route' && routes.length > 0 && <RouteLayer routes={routes} />}
                  {mapLayerMode === 'pace' && paceSegments.length > 0 && (
                    <PaceRouteLayer
                      segments={paceSegments}
                      activityId={activitiesData?.activities[0]?.id || 'default'}
                    />
                  )}
                </AnimatePresence>
              </RunMap>
            </div>

            {/* Pace Legend */}
            <AnimatePresence>
              {mapLayerMode === 'pace' && paceSegments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 rounded-lg border border-white/20 bg-white/90 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-black/90"
                >
                  <div className="text-label/60 mb-1.5 text-xs font-medium">配速图例</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="bg-green h-2 w-4 rounded-sm" />
                      <span className="text-label/50">快</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-yellow h-2 w-4 rounded-sm" />
                      <span className="text-label/50">中</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="bg-red h-2 w-4 rounded-sm" />
                      <span className="text-label/50">慢</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Activity Heatmap */}
        {activitiesData && activitiesData.activities.length > 0 && (
          <section className="mb-12">
            <ActivityHeatmap activities={activitiesData.activities} />
          </section>
        )}

        {/* Personal Records */}
        {activitiesData && activitiesData.activities.length > 0 && (
          <section className="mb-12">
            <PersonalRecords activities={activitiesData.activities} />
          </section>
        )}

        {/* Activities Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-label text-xl font-semibold">最近活动</h2>
              <p className="text-tertiary-label mt-1 text-sm">你的运动记录</p>
            </div>
            {activitiesData && activitiesData.pagination.total > 0 && (
              <span className="bg-secondary-system-background text-secondary-label rounded-full px-3 py-1 text-xs font-medium">
                {activitiesData.activities.length} / {activitiesData.pagination.total}
              </span>
            )}
          </div>

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
          {activitiesData && !activitiesLoading && (
            <ActivityTable activities={activitiesData.activities} />
          )}
        </section>
      </main>
    </div>
  )
}

/**
 * Parse GPX XML data to extract coordinates for map display
 */
function parseGPXCoordinates(gpxData: string): Array<{ longitude: number; latitude: number }> {
  if (!gpxData || gpxData.trim() === '') return []

  try {
    // Simple regex-based parsing for GPX trackpoints
    const trkptRegex = /<trkpt[^>]+lat=["']([^"']+)["'][^>]+lon=["']([^"']+)["']/gi
    const coordinates: Array<{ longitude: number; latitude: number }> = []

    let match
    while ((match = trkptRegex.exec(gpxData)) !== null) {
      const lat = Number.parseFloat(match[1])
      const lon = Number.parseFloat(match[2])

      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        coordinates.push({ latitude: lat, longitude: lon })
      }
    }

    // If no trkpt found, try alternative format (lon before lat)
    if (coordinates.length === 0) {
      const altRegex = /<trkpt[^>]+lon=["']([^"']+)["'][^>]+lat=["']([^"']+)["']/gi
      while ((match = altRegex.exec(gpxData)) !== null) {
        const lon = Number.parseFloat(match[1])
        const lat = Number.parseFloat(match[2])

        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          coordinates.push({ latitude: lat, longitude: lon })
        }
      }
    }

    // Simplify the route if too many points
    if (coordinates.length > 500) {
      const step = Math.ceil(coordinates.length / 500)
      return coordinates.filter((_, index) => index % step === 0)
    }

    return coordinates
  } catch (error) {
    console.error('Failed to parse GPX coordinates:', error)
    return []
  }
}
