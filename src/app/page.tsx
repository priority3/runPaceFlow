/**
 * Home Page - Modern Activity Dashboard
 *
 * Minimalist design inspired by Apple Fitness+
 */

'use client'

import { Activity, Calendar, Clock, MapPin } from 'lucide-react'
import { useMemo } from 'react'

import { ActivityTable } from '@/components/activity/ActivityTable'
import { StatsCard } from '@/components/activity/StatsCard'
import { Header } from '@/components/layout/Header'
import { RouteLayer } from '@/components/map/RouteLayer'
import { RunMap } from '@/components/map/RunMap'
import { useActivities, useActivityStats } from '@/hooks/use-activities'
import type { Activity as ActivityType } from '@/types/activity'
import type { RouteData } from '@/types/map'

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useActivityStats()
  const { data: activitiesData, isLoading: activitiesLoading, error } = useActivities({ limit: 20 })

  // Parse GPX data to routes and calculate bounds for map display
  const { routes, bounds } = useMemo(() => {
    if (!activitiesData?.activities) return { routes: [], bounds: null }

    const parsedRoutes = activitiesData.activities
      .filter((activity: ActivityType) => activity.gpxData)
      .map((activity: ActivityType) => ({
        id: activity.id,
        coordinates: parseGPXCoordinates(activity.gpxData || ''),
        color: '#1f2937', // Dark gray for better visibility on light map
        width: 3,
      }))
      .filter((route: RouteData) => route.coordinates.length > 0)

    // Calculate bounds from all routes
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
  }, [activitiesData])

  return (
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <Header />

      <main className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Stats Grid */}
        <section className="mb-12">
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={`stats-skeleton-${i}`}
                  className="bg-secondary-system-background/50 h-32 animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatsCard
                title="总里程"
                value={(stats.total.distance / 1000).toFixed(1)}
                unit="km"
                icon={<MapPin className="h-4 w-4" />}
                delay={1}
              />
              <StatsCard
                title="活动次数"
                value={stats.total.activities}
                unit="次"
                icon={<Activity className="h-4 w-4" />}
                delay={2}
              />
              <StatsCard
                title="本周里程"
                value={(stats.thisWeek.distance / 1000).toFixed(1)}
                unit="km"
                icon={<Calendar className="h-4 w-4" />}
                delay={3}
              />
              <StatsCard
                title="总时长"
                value={(stats.total.duration / 3600).toFixed(1)}
                unit="小时"
                icon={<Clock className="h-4 w-4" />}
                delay={4}
              />
            </div>
          ) : null}
        </section>

        {/* Map Section */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-label text-xl font-semibold">路线地图</h2>
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
        </section>

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
    // Matches: <trkpt lat="39.123" lon="116.456">
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

    // Simplify the route if too many points (keep every nth point for performance)
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
