/**
 * Activity Detail Page
 *
 * Spring-based animations with shared element transitions
 */

'use client'

import { motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { Pause, Play, Square } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'

import { ActivityActionBar } from '@/components/activity/ActivityActionBar'
import { PaceChart } from '@/components/activity/PaceChart'
import { SplitsTable } from '@/components/activity/SplitsTable'
import { WeatherInfo } from '@/components/activity/WeatherInfo'
import { FloatingInfoCard } from '@/components/map/FloatingInfoCard'
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary'
import { AnimatedTabs, AnimatedTabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActivityWithSplits, useGpxData } from '@/hooks/use-activities'
import { useGpxParser } from '@/hooks/use-gpx-parser'
import { springs } from '@/lib/animation'
import { generateMockTrackPoints } from '@/lib/map/mock-data'
import type { TrackPoint } from '@/lib/map/pace-utils'
import { createKilometerMarkers, createPaceSegments } from '@/lib/map/pace-utils'
import { calculateSpeed, formatDuration, formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { useTheme } from '@/lib/theme'
import { getTrainingColors } from '@/lib/theme/palette'
import { cn, formatDate, formatTime } from '@/lib/utils'
import { animationProgressAtom, isPlayingAtom } from '@/stores/map'
import type { Split } from '@/types/activity'

// Lazy load map components - MapLibre GL is ~60KB gzipped
const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((m) => ({ default: m.RunMap })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-secondary-system-background h-[300px] animate-pulse rounded-lg sm:h-[400px]" />
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

const PlaybackMarker = dynamic(() =>
  import('@/components/map/PlaybackMarker').then((m) => ({ default: m.PlaybackMarker })),
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
  const { resolvedTheme } = useTheme()
  const trainingColors = getTrainingColors(resolvedTheme)
  const params = useParams()
  const searchParams = useSearchParams()
  const activityId = params.id as string

  // Reason: Debug mode allows isolating which component causes browser crashes.
  // Use ?debug=nomap to skip map, ?debug=basic to only render the info card.
  // Use ?map=manual to enable click-to-load mode for MapLibre.
  const debugMode = searchParams.get('debug')
  const mapMode = searchParams.get('map')
  const mapAutoLoad = mapMode !== 'manual'

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
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Parse GPX data in a Web Worker to avoid blocking the main thread
  const { trackPoints: parsedPoints, heartRateData } = useGpxParser(gpxData)

  // Derive map data from worker-parsed track points
  const { paceSegments, kmMarkers, trackPoints, bounds } = (() => {
    // Use worker-parsed points, or fall back to mock data for outdoor activities
    const points =
      parsedPoints.length > 0
        ? parsedPoints
        : !data?.activity.isIndoor
          ? generateMockTrackPoints()
          : []

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

    // Reason: only create km markers from real parsed data. Mock data places
    // markers at Beijing coords; when real data (e.g. Chengdu) arrives with the
    // same React keys, the react-maplibre Marker's useMemo([]) holds stale
    // internal maplibregl.Marker instances, causing km 1-N to vanish from the DOM.
    const markers = parsedPoints.length > 0 ? createKilometerMarkers(points) : []

    return {
      paceSegments: createPaceSegments(points, averagePace, 50, resolvedTheme),
      kmMarkers: markers,
      trackPoints: points,
      bounds: mapBounds,
    }
  })()

  const startPoint = trackPoints[0]
  const endPoint = trackPoints.at(-1)

  // Get current point for animation
  const currentPoint = (() => {
    if (trackPoints.length === 0 || animationProgress <= 0) return
    const totalDistance = trackPoints.at(-1)?.distance ?? 0
    if (totalDistance <= 0) return trackPoints[0]

    const targetDistance = (animationProgress / 100) * totalDistance
    return findTrackPointByDistance(trackPoints, targetDistance)
  })()

  const paceProbePoint = currentPoint ?? startPoint

  const currentPaceInfo = (() => {
    if (!paceProbePoint) return
    for (let i = paceSegments.length - 1; i >= 0; i--) {
      const segment = paceSegments[i]
      if (paceProbePoint.distance >= segment.distance) {
        return { pace: segment.pace, color: segment.color }
      }
    }
    return
  })()

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
        <DetailHeader />
        <div className="relative container mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
          <div className="bg-secondary-system-background mb-8 h-64 animate-pulse rounded-lg sm:h-80" />
          <div className="bg-secondary-system-background mb-6 h-24 animate-pulse rounded-lg" />
          <div className="bg-secondary-system-background h-64 animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-system-background min-h-screen">
        <DetailHeader />
        <div className="relative container mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
          <motion.div
            className="premium-surface flex flex-col items-center justify-center py-16"
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
  const isCycling = activity.type === 'cycling'
  const metricMode = isCycling ? 'speed' : 'pace'
  const metricLabel = isCycling ? '速度' : '配速'
  const primaryMetricVisible = isCycling
    ? activity.distance > 0 && activity.duration > 0
    : !!activity.averagePace
  const primaryMetricValue = isCycling
    ? calculateSpeed(activity.distance, activity.duration).toFixed(1)
    : activity.averagePace
      ? formatPace(activity.averagePace)
      : ''
  const primaryMetricUnit = isCycling ? 'km/h' : ''
  const primaryMetricTitle = isCycling ? '均速' : '配速'
  const metricTextClassName = isCycling ? 'text-orange' : 'text-blue'
  const metricSubTextClassName = isCycling ? 'text-orange/60' : 'text-blue/60'
  const bestMetricTitle = isCycling ? '最快速度' : '最快配速'
  const bestMetricUnit = isCycling ? 'km/h' : '/km'
  const noMetricDataText = isCycling ? '暂无速度数据' : '暂无配速数据'

  // Convert database splits to chart format
  const chartSplits = activitySplits.map((split: Split) => ({
    kilometer: split.kilometer,
    pace: split.pace,
    distance: split.distance,
    duration: split.duration,
  }))

  return (
    <div className="bg-system-background min-h-screen">
      <DetailHeader
        rightSlot={
          !activity.isIndoor &&
          !skipMap && (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handlePlayPause}
                className="premium-surface hover:bg-secondary-system-background flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
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
                  className="premium-surface text-secondary-label hover:text-label hover:bg-secondary-system-background flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springs.snappy}
                  whileTap={{ scale: 0.98 }}
                >
                  <Square className="h-3.5 w-3.5" />
                </motion.button>
              )}
            </div>
          )
        }
      />

      <div className="relative container mx-auto max-w-6xl px-4 pt-20 pb-6 sm:px-6 sm:pt-24 sm:pb-8 lg:px-8">
        {/* Map Section - Only show for outdoor activities, skip in debug modes */}
        {!activity.isIndoor && !skipMap && (
          <section className="mb-0">
            <div className="relative overflow-hidden rounded-lg shadow-[0_24px_70px_rgba(24,33,47,0.16)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
              <div className="h-[300px] sm:h-[400px]">
                <MapErrorBoundary>
                  <RunMap
                    className="h-full w-full"
                    bounds={bounds || undefined}
                    boundsPadding={48}
                    autoLoad={mapAutoLoad}
                  >
                    {/* Reason: keyed Fragments force React to unmount/remount instead of
                        reusing the PaceRouteLayer instance, which would change the
                        MapLibre Source id and crash with "source id changed". */}
                    {isPlaying || animationProgress > 0 ? (
                      <Fragment key="playback">
                        <PaceRouteLayer
                          segments={paceSegments}
                          activityId={`${activityId}-ghost`}
                          variant="mono"
                          color={trainingColors.routeMono}
                          opacity={0.22}
                          showGlow={false}
                        />
                        <AnimatedRoute
                          segments={paceSegments}
                          activityId={activityId}
                          isPlaying={isPlaying}
                          onProgressChange={setAnimationProgress}
                          onAnimationComplete={handleAnimationComplete}
                          speed={0.2}
                        />
                        <PlaybackMarker
                          current={currentPoint ?? (isPlaying ? startPoint : undefined)}
                          start={startPoint}
                          end={endPoint}
                          accentColor={currentPaceInfo?.color}
                        />
                      </Fragment>
                    ) : (
                      <Fragment key="static">
                        <PaceRouteLayer segments={paceSegments} activityId={activityId} />
                        <KilometerMarkers markers={kmMarkers} metric={metricMode} />
                      </Fragment>
                    )}
                  </RunMap>
                </MapErrorBoundary>

                {/* Floating info card during playback */}
                {(isPlaying || animationProgress > 0) && (currentPoint || startPoint) && (
                  <FloatingInfoCard
                    currentPoint={currentPoint ?? startPoint}
                    startTime={startPoint?.time}
                    averagePace={activity.averagePace || 360}
                    currentPace={currentPaceInfo?.pace}
                    currentPaceColor={currentPaceInfo?.color}
                    isPlaying={isPlaying}
                    progress={animationProgress}
                    metric={metricMode}
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
          className={cn(
            'premium-surface px-5 py-4 sm:px-6 sm:py-5',
            !activity.isIndoor && !skipMap ? 'relative z-20 mx-3 -mt-14 mb-8 sm:mx-6' : 'mb-8',
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Title and date */}
            <div className="min-w-0">
              <h1 className="text-label truncate text-xl font-semibold sm:text-2xl">
                <span>{`${typeEmoji} ${activity.title || '跑步活动'}`}</span>
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
              {primaryMetricVisible && (
                <div className="flex flex-col items-center">
                  <span
                    className={`${metricTextClassName} text-lg font-semibold tabular-nums sm:text-xl`}
                  >
                    {primaryMetricValue}
                    {primaryMetricUnit && (
                      <span className={`${metricSubTextClassName} ml-1 text-xs`}>
                        {primaryMetricUnit}
                      </span>
                    )}
                  </span>
                  <span className={`${metricSubTextClassName} text-xs`}>{primaryMetricTitle}</span>
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
              <TabsTrigger value="pace">{metricLabel}分析</TabsTrigger>
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
                  <div className="premium-surface p-6">
                    <h3 className="text-label/80 mb-4 text-sm font-medium">每公里{metricLabel}</h3>
                    <PaceChart
                      splits={chartSplits}
                      averagePace={activity.averagePace || 360}
                      metric={metricMode}
                    />
                  </div>
                  <PaceDistribution
                    splits={chartSplits}
                    averagePace={activity.averagePace || 360}
                    metric={metricMode}
                  />
                </div>
              ) : (
                <div className="premium-surface text-secondary-label p-8 text-center">
                  {noMetricDataText}
                </div>
              )}
            </AnimatedTabsContent>

            {/* Heart Rate Tab */}
            {(heartRateData.length > 0 || activity.averageHeartRate) && (
              <AnimatedTabsContent value="heartrate">
                <div className="space-y-6">
                  {/* Heart Rate Chart */}
                  {heartRateData.length > 0 && (
                    <div className="premium-surface p-6">
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
                <div className="premium-surface p-6">
                  <h3 className="text-label/80 mb-4 text-sm font-medium">分段数据</h3>
                  <SplitsTable splits={chartSplits} metric={metricMode} />
                </div>
              ) : (
                <div className="premium-surface text-secondary-label p-8 text-center">
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
                <div className="premium-surface p-6">
                  <h3 className="text-label/80 mb-4 text-sm font-medium">其他数据</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {activity.calories && (
                      <div className="bg-secondary-system-background rounded-lg p-4">
                        <div className="text-label/50 text-xs">卡路里</div>
                        <div className="text-label mt-1 text-2xl font-semibold tabular-nums">
                          {activity.calories}
                          <span className="text-label/50 ml-1 text-sm">kcal</span>
                        </div>
                      </div>
                    )}
                    {activity.bestPace && (
                      <div className="bg-secondary-system-background rounded-lg p-4">
                        <div className="text-label/50 text-xs">{bestMetricTitle}</div>
                        <div className="text-label mt-1 text-2xl font-semibold tabular-nums">
                          {isCycling
                            ? paceToSpeed(activity.bestPace).toFixed(1)
                            : formatPace(activity.bestPace)}
                          <span className="text-label/50 ml-1 text-sm">{bestMetricUnit}</span>
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
            console.info('Export as:', format)
          }}
        />
      </div>
    </div>
  )
}

function DetailHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="bg-system-background/90 fixed inset-x-0 top-0 z-40 shadow-[0_8px_30px_rgba(24,33,47,0.045)] backdrop-blur-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.22)]">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo-mark.png?v=1"
            alt="RunPaceFlow"
            width={40}
            height={40}
            priority
            unoptimized
            className="h-10 w-10 shrink-0 bg-transparent object-contain dark:invert"
          />
          <span className="font-display text-label text-base font-semibold transition-opacity group-hover:opacity-80">
            RunPaceFlow
          </span>
        </Link>
        <div className="flex min-h-10 items-center">{rightSlot}</div>
      </div>
    </header>
  )
}

function findTrackPointByDistance(points: TrackPoint[], targetDistance: number): TrackPoint {
  let low = 0
  let high = points.length - 1

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (points[mid].distance < targetDistance) {
      low = mid + 1
    } else {
      high = mid
    }
  }

  return points[Math.max(0, Math.min(points.length - 1, low))]
}
