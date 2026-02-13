/**
 * Activity Detail Page
 *
 * Spring-based animations with shared element transitions
 */

'use client'

import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { ArrowLeft, Pause, Play, Square } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { ActivityActionBar } from '@/components/activity/ActivityActionBar'
import { PaceChart } from '@/components/activity/PaceChart'
import { SplitsTable } from '@/components/activity/SplitsTable'
import { WeatherInfo } from '@/components/activity/WeatherInfo'
import { FloatingInfoCard } from '@/components/map/FloatingInfoCard'
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary'
import { AnimatedTabs, AnimatedTabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActivityWithSplits, useGpxData } from '@/hooks/use-activities'
import { springs } from '@/lib/animation'
import { generateMockTrackPoints } from '@/lib/map/mock-data'
import type { TrackPoint } from '@/lib/map/pace-utils'
import { createKilometerMarkers, createPaceSegments } from '@/lib/map/pace-utils'
import { formatDuration, formatPace } from '@/lib/pace/calculator'
import { parseGPX } from '@/lib/sync/parser'
import { formatDate, formatTime } from '@/lib/utils'
import { animationProgressAtom, isPlayingAtom } from '@/stores/map'
import type { Split } from '@/types/activity'

// Lazy load map components - MapLibre GL is ~60KB gzipped
const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((m) => ({ default: m.RunMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-2xl bg-gray-100 sm:h-[400px] dark:bg-gray-900" />
    ),
  },
)

const AnimatedRoute = dynamic(() =>
  import('@/components/map/AnimatedRoute').then((m) => ({ default: m.AnimatedRoute })),
)

const PaceRouteLayer = dynamic(() =>
  import('@/components/map/PaceRouteLayer').then((m) => ({ default: m.PaceRouteLayer })),
)

const KilometerMarkers = dynamic(() =>
  import('@/components/map/KilometerMarkers').then((m) => ({ default: m.KilometerMarkers })),
)

// Lazy load non-default tab components to reduce initial bundle
// Reason: Recharts (~40KB gz) and other heavy components shouldn't load until user clicks the tab
const HeartRateChart = dynamic(() =>
  import('@/components/activity/HeartRateChart').then((m) => ({ default: m.HeartRateChart })),
)

const HeartRateZones = dynamic(() =>
  import('@/components/activity/HeartRateZones').then((m) => ({ default: m.HeartRateZones })),
)

const PaceDistribution = dynamic(() =>
  import('@/components/activity/PaceDistribution').then((m) => ({ default: m.PaceDistribution })),
)

const ArtGallery = dynamic(() =>
  import('@/components/art/ArtGallery').then((m) => ({ default: m.ArtGallery })),
)

const AIInsight = dynamic(() =>
  import('@/components/activity/AIInsight').then((m) => ({ default: m.AIInsight })),
)

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activityId = params.id as string

  // Reason: Debug mode allows isolating which component causes browser crashes.
  // Use ?debug=nomap to skip map, ?debug=basic to only render the info card.
  const debugMode = searchParams.get('debug')

  // Fetch activity data with splits (excludes gpxData)
  const { data, isLoading, error } = useActivityWithSplits(activityId)

  // Lazy-load GPX data separately (can be several MB)
  // Reason: Skip GPX fetch in debug modes that don't need the map
  const skipMap = debugMode === 'nomap' || debugMode === 'basic'
  const { data: gpxData } = useGpxData(activityId, !!data && !data.activity.isIndoor && !skipMap)

  // Playback state
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom)
  const [animationProgress, setAnimationProgress] = useAtom(animationProgressAtom)

  // Client-side mount state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Parse GPX data and generate track points
  const { paceSegments, kmMarkers, trackPoints, bounds, heartRateData } = useMemo(() => {
    let points: TrackPoint[] = []
    const hrData: { distance: number; heartRate: number }[] = []

    // Try to parse real GPX data (loaded separately to avoid blocking initial render)
    if (gpxData) {
      try {
        const gpxResult = parseGPX(gpxData)
        if (gpxResult.tracks.length > 0 && gpxResult.tracks[0].points.length > 0) {
          // Convert GPX points to TrackPoint format
          let cumulativeDistance = 0
          const gpxPoints = gpxResult.tracks[0].points

          points = gpxPoints.map((pt, i) => {
            if (i > 0) {
              // Calculate distance from previous point using Haversine
              const prev = gpxPoints[i - 1]
              const R = 6371e3
              const φ1 = (prev.lat * Math.PI) / 180
              const φ2 = (pt.lat * Math.PI) / 180
              const Δφ = ((pt.lat - prev.lat) * Math.PI) / 180
              const Δλ = ((pt.lon - prev.lon) * Math.PI) / 180
              const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              cumulativeDistance += R * c
            }

            // Extract heart rate data if available
            if (pt.hr !== undefined) {
              hrData.push({
                distance: cumulativeDistance,
                heartRate: pt.hr,
              })
            }

            return {
              longitude: pt.lon,
              latitude: pt.lat,
              elevation: pt.ele,
              time: pt.time || new Date(),
              distance: cumulativeDistance,
            }
          })
        }
      } catch (err) {
        console.warn('Failed to parse GPX data:', err)
      }
    }

    // Fall back to mock data if no real GPX (only for outdoor activities)
    if (points.length === 0 && !data?.activity.isIndoor) {
      points = generateMockTrackPoints()
    }

    const averagePace = data?.activity.averagePace || 360

    // Calculate bounds for map fitting
    let mapBounds = null
    if (points.length > 0) {
      const lngs = points.map((p) => p.longitude)
      const lats = points.map((p) => p.latitude)
      mapBounds = {
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
      }
    }

    return {
      paceSegments: createPaceSegments(points, averagePace, 50),
      kmMarkers: createKilometerMarkers(points),
      trackPoints: points,
      bounds: mapBounds,
      heartRateData: hrData,
    }
  }, [data, gpxData])

  // Get current point for animation
  const currentPoint = useMemo(() => {
    if (trackPoints.length === 0 || animationProgress === 0) return
    const index = Math.floor((animationProgress / 100) * trackPoints.length)
    return trackPoints[Math.min(index, trackPoints.length - 1)]
  }, [trackPoints, animationProgress])

  // Playback controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleStopPlayback = () => {
    setIsPlaying(false)
    setAnimationProgress(0)
  }

  const handleAnimationComplete = () => {
    setIsPlaying(false)
    setAnimationProgress(100)
  }

  // Loading state - also show during SSR to prevent hydration mismatch
  if (isLoading || !isMounted) {
    return (
      <div className="bg-system-background min-h-screen">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 h-10 w-24 animate-pulse rounded-xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
          <div className="mb-8 h-64 animate-pulse rounded-2xl bg-white/40 backdrop-blur-xl sm:h-80 dark:bg-black/20" />
          <div className="mb-6 h-24 animate-pulse rounded-xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-system-background min-h-screen">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-label/60 hover:text-label mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
          <motion.div
            className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/50 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-label text-lg font-medium">加载失败</p>
            <p className="text-label/50 mt-2 text-center text-sm">
              {error?.message || '无法找到该活动'}
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  const { activity, splits: activitySplits } = data
  const typeEmoji = activity.type === 'running' ? '🏃' : activity.type === 'cycling' ? '🚴' : '🚶'

  // Convert database splits to chart format
  const chartSplits = activitySplits.map((split: Split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    distance: split.distance,
    duration: split.duration,
  }))

  return (
    <div className="bg-system-background min-h-screen">
      {/* Subtle gradient overlay for glassmorphic depth */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-gray-200/30 dark:from-gray-900/50 dark:to-gray-800/30" />

      <div className="relative container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-label/60 hover:text-label flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </button>

            {/* Playback controls - only show for outdoor activities when map is visible */}
            {!activity.isIndoor && !skipMap && (
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handlePlayPause}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-4 py-2 text-sm font-medium backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snappy}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span className="hidden sm:inline">暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span className="hidden sm:inline">回放</span>
                    </>
                  )}
                </motion.button>
                {animationProgress > 0 && (
                  <motion.button
                    onClick={handleStopPlayback}
                    className="text-label/60 hover:text-label flex items-center gap-2 rounded-xl border border-white/20 bg-white/40 px-3 py-2 text-sm backdrop-blur-xl transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={springs.snappy}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Square className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map Section - Only show for outdoor activities, skip in debug modes */}
        {!activity.isIndoor && !skipMap && (
          <section className="mb-6">
            <div className="relative overflow-hidden rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30">
              <div className="h-[300px] sm:h-[400px]">
                <MapErrorBoundary>
                  <RunMap className="h-full w-full" bounds={bounds || undefined}>
                    {/* Static pace route or animated playback */}
                    {isPlaying ? (
                      <AnimatedRoute
                        segments={paceSegments}
                        activityId={activityId}
                        isPlaying={isPlaying}
                        onProgressChange={setAnimationProgress}
                        onAnimationComplete={handleAnimationComplete}
                        speed={1.5}
                      />
                    ) : (
                      <>
                        <PaceRouteLayer segments={paceSegments} activityId={activityId} />
                        <KilometerMarkers markers={kmMarkers} />
                      </>
                    )}
                  </RunMap>
                </MapErrorBoundary>

                {/* Floating info card during playback */}
                {isPlaying && currentPoint && (
                  <FloatingInfoCard
                    currentPoint={currentPoint}
                    averagePace={activity.averagePace || 360}
                    isPlaying={isPlaying}
                    progress={animationProgress}
                    onPlayPause={handlePlayPause}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Activity Info Card - Compact one-line stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 rounded-xl border border-white/20 bg-white/50 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Title and date */}
            <div className="min-w-0">
              <h1 className="text-label truncate text-xl font-semibold sm:text-2xl">
                <span>{typeEmoji}</span> {activity.title || '跑步活动'}
              </h1>
              <p className="text-label/50 mt-1 text-sm">
                {formatDate(activity.startTime)} {formatTime(activity.startTime)}
              </p>
            </div>

            {/* Core stats in one row */}
            <div className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
              <div className="flex flex-col items-center">
                <span className="text-label text-lg font-semibold tabular-nums sm:text-xl">
                  {(activity.distance / 1000).toFixed(2)}
                </span>
                <span className="text-label/50 text-xs">公里</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-label text-lg font-semibold tabular-nums sm:text-xl">
                  {formatDuration(activity.duration)}
                </span>
                <span className="text-label/50 text-xs">时长</span>
              </div>
              {activity.averagePace && (
                <div className="flex flex-col items-center">
                  <span className="text-blue text-lg font-semibold tabular-nums sm:text-xl">
                    {formatPace(activity.averagePace)}
                  </span>
                  <span className="text-blue/60 text-xs">配速</span>
                </div>
              )}
              {activity.elevationGain !== null && activity.elevationGain > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-label text-lg font-semibold tabular-nums sm:text-xl">
                    ↗{activity.elevationGain.toFixed(0)}
                  </span>
                  <span className="text-label/50 text-xs">爬升</span>
                </div>
              )}
              {activity.averageHeartRate && (
                <div className="flex flex-col items-center">
                  <span className="text-red text-lg font-semibold tabular-nums sm:text-xl">
                    ❤{activity.averageHeartRate}
                  </span>
                  <span className="text-red/60 text-xs">心率</span>
                </div>
              )}
              {activity.weatherData && <WeatherInfo weatherDataJson={activity.weatherData} />}
            </div>
          </div>
        </motion.div>

        {/* Tabbed Content Section - skip in basic debug mode */}
        {debugMode !== 'basic' && (
          <AnimatedTabs defaultValue="pace" className="w-full">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="pace">配速分析</TabsTrigger>
              {(heartRateData.length > 0 || activity.averageHeartRate) && (
                <TabsTrigger value="heartrate">心率</TabsTrigger>
              )}
              <TabsTrigger value="splits">分段数据</TabsTrigger>
              <TabsTrigger value="art">艺术</TabsTrigger>
              <TabsTrigger value="ai">AI 分析</TabsTrigger>
              {activity.calories && <TabsTrigger value="more">更多数据</TabsTrigger>}
            </TabsList>

            {/* Pace Analysis Tab */}
            <AnimatedTabsContent value="pace">
              {chartSplits.length > 0 ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                    <h3 className="text-label/80 mb-4 text-sm font-medium">每公里配速</h3>
                    <PaceChart splits={chartSplits} averagePace={activity.averagePace || 360} />
                  </div>
                  <PaceDistribution
                    splits={chartSplits}
                    averagePace={activity.averagePace || 360}
                  />
                </div>
              ) : (
                <div className="text-label/50 rounded-2xl border border-white/20 bg-white/50 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                  暂无配速数据
                </div>
              )}
            </AnimatedTabsContent>

            {/* Heart Rate Tab */}
            {(heartRateData.length > 0 || activity.averageHeartRate) && (
              <AnimatedTabsContent value="heartrate">
                <div className="space-y-6">
                  {/* Heart Rate Chart */}
                  {heartRateData.length > 0 && (
                    <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                      <h3 className="text-label/80 mb-4 text-sm font-medium">心率变化</h3>
                      <HeartRateChart
                        data={heartRateData}
                        averageHeartRate={activity.averageHeartRate ?? undefined}
                        maxHeartRate={activity.maxHeartRate ?? undefined}
                      />
                    </div>
                  )}

                  {/* Heart Rate Zones */}
                  {activity.averageHeartRate && activity.maxHeartRate && (
                    <HeartRateZones
                      averageHeartRate={activity.averageHeartRate}
                      maxHeartRate={activity.maxHeartRate}
                    />
                  )}
                </div>
              </AnimatedTabsContent>
            )}

            {/* Splits Table Tab */}
            <AnimatedTabsContent value="splits">
              {chartSplits.length > 0 ? (
                <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                  <h3 className="text-label/80 mb-4 text-sm font-medium">分段数据</h3>
                  <SplitsTable splits={chartSplits} />
                </div>
              ) : (
                <div className="text-label/50 rounded-2xl border border-white/20 bg-white/50 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                  暂无分段数据
                </div>
              )}
            </AnimatedTabsContent>

            {/* AI Insight Tab */}
            <AnimatedTabsContent value="ai">
              <AIInsight activityId={activityId} />
            </AnimatedTabsContent>

            {/* Art Gallery Tab */}
            <AnimatedTabsContent value="art">
              <ArtGallery
                splits={chartSplits}
                trackPoints={trackPoints}
                paceSegments={paceSegments}
                kmMarkers={kmMarkers}
                heartRateData={heartRateData}
                activity={activity}
              />
            </AnimatedTabsContent>

            {/* More Data Tab - Calories and other stats */}
            {activity.calories && (
              <AnimatedTabsContent value="more">
                <div className="rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
                  <h3 className="text-label/80 mb-4 text-sm font-medium">其他数据</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {activity.calories && (
                      <div className="rounded-xl bg-white/40 p-4 dark:bg-white/5">
                        <div className="text-label/50 text-xs">卡路里</div>
                        <div className="text-label mt-1 text-2xl font-semibold tabular-nums">
                          {activity.calories}
                          <span className="text-label/50 ml-1 text-sm">kcal</span>
                        </div>
                      </div>
                    )}
                    {activity.bestPace && (
                      <div className="rounded-xl bg-white/40 p-4 dark:bg-white/5">
                        <div className="text-label/50 text-xs">最快配速</div>
                        <div className="text-label mt-1 text-2xl font-semibold tabular-nums">
                          {formatPace(activity.bestPace)}
                          <span className="text-label/50 ml-1 text-sm">/km</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedTabsContent>
            )}
          </AnimatedTabs>
        )}

        {/* Bottom Action Bar */}
        <ActivityActionBar
          activityId={activityId}
          activityTitle={activity.title || '跑步活动'}
          onExport={(format) => {
            // TODO: Implement export functionality
            console.log('Export as:', format)
          }}
        />
      </div>
    </div>
  )
}
