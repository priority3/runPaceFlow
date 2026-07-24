/**
 * Activity Detail Page
 *
 * Spring-based animations with shared element transitions
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { Check, Copy, MoreHorizontal, Share2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import { ActivityActionBar } from '@/components/activity/ActivityActionBar'
import { PaceChart } from '@/components/activity/PaceChart'
import { SplitsTable } from '@/components/activity/SplitsTable'
import { WeatherInfo } from '@/components/activity/WeatherInfo'
import { MapErrorBoundary } from '@/components/map/MapErrorBoundary'
import { PlaybackControls } from '@/components/map/PlaybackControls'
import { useActivityWithSplits, useGpxData } from '@/hooks/use-activities'
import { useGpxParser } from '@/hooks/use-gpx-parser'
import { pressable, springs } from '@/lib/animation'
import { generateMockTrackPoints } from '@/lib/map/mock-data'
import type { TrackPoint } from '@/lib/map/pace-utils'
import { createKilometerMarkers, createPaceSegments } from '@/lib/map/pace-utils'
import { calculateSpeed, formatDuration, formatPace, paceToSpeed } from '@/lib/pace/calculator'
import { useTheme } from '@/lib/theme'
import { getTrainingColors } from '@/lib/theme/palette'
import { cn, formatDate, formatTime } from '@/lib/utils'
import {
  animationProgressAtom,
  isPlayingAtom,
  playbackSpeedAtom,
  selectedKilometerAtom,
} from '@/stores/map'
import type { Split } from '@/types/activity'

// Lazy load map components - MapLibre GL is ~60KB gzipped
const RunMap = dynamic(
  () => import('@/components/map/RunMap').then((m) => ({ default: m.RunMap })),
  {
    ssr: false,
    loading: () => <div className="skeleton-shimmer h-[320px] rounded-2xl sm:h-[420px]" />,
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

// Lazy load heavier panels (charts / art / AI) — still code-split, just always mounted in sections
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

  // Playback + shared selection state
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom)
  const [animationProgress, setAnimationProgress] = useAtom(animationProgressAtom)
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom)
  const [selectedKm, setSelectedKm] = useAtom(selectedKilometerAtom)

  // Client-side mount state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [activeSection, setActiveSection] = useState('pace')

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Reset playback when navigating to another activity
  useEffect(() => {
    setIsPlaying(false)
    setAnimationProgress(0)
    setSelectedKm(null)
  }, [activityId, setIsPlaying, setAnimationProgress, setSelectedKm])

  const scrollToSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    const el = document.getElementById(`section-${sectionId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Parse GPX data in a Web Worker to avoid blocking the main thread
  const { trackPoints: parsedPoints, heartRateData } = useGpxParser(gpxData)

  // Sticky mini-nav: highlight section in view
  useEffect(() => {
    if (!isMounted) return
    const ids = ['pace', 'heartrate', 'splits', 'art', 'ai', 'more']
    const nodes = ids
      .map((id) => document.getElementById(`section-${id}`))
      .filter((n): n is HTMLElement => !!n)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]
        if (top?.target?.id) {
          setActiveSection(top.target.id.replace('section-', ''))
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4, 0.7] },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [isMounted, data, heartRateData.length])

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

  const handlePlayPause = () => {
    // Restart from beginning if finished
    if (!isPlaying && animationProgress >= 100) {
      setAnimationProgress(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleStopPlayback = () => {
    setIsPlaying(false)
    setAnimationProgress(0)
  }

  const handleSeek = useCallback(
    (next: number) => {
      // Pause while scrubbing so clip follows the thumb immediately
      if (isPlaying) setIsPlaying(false)
      setAnimationProgress(next)
    },
    [isPlaying, setIsPlaying, setAnimationProgress],
  )

  const handleAnimationComplete = () => {
    setIsPlaying(false)
    setAnimationProgress(100)
  }

  const handleSelectKilometer = useCallback(
    (km: number) => {
      setSelectedKm(km)
      scrollToSection('splits')
    },
    [setSelectedKm, scrollToSection],
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  // Km currently under the playback head (for chart/table highlight)
  const playbackKilometer = useMemo(() => {
    if (!currentPoint || kmMarkers.length === 0) return null
    let current = 0
    for (const marker of kmMarkers) {
      if (currentPoint.distance >= marker.distance) current = marker.kilometer
      else break
    }
    return current > 0 ? current : null
  }, [currentPoint, kmMarkers])

  const elapsedSeconds = useMemo(() => {
    if (!currentPoint || !startPoint) return 0
    return Math.max(0, Math.floor((currentPoint.time.getTime() - startPoint.time.getTime()) / 1000))
  }, [currentPoint, startPoint])

  // Loading state - also show during SSR to prevent hydration mismatch
  if (isLoading || !isMounted) {
    return (
      <div className="bg-system-background min-h-screen">
        <DetailHeader />
        <div
          className="relative container mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-20 lg:px-8"
          role="status"
          aria-label="活动详情加载中"
        >
          <div className="skeleton-shimmer mb-0 h-[300px] rounded-t-2xl sm:h-[400px]" />
          <div className="bg-tertiary-system-background/92 mb-5 rounded-b-2xl border-t border-[rgb(var(--color-separator))] px-4 py-3">
            <div className="skeleton-shimmer h-8 w-full rounded-full" />
          </div>
          <div className="surface-panel mb-8 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="skeleton-shimmer h-5 w-40 rounded-md" />
                <div className="skeleton-shimmer h-3 w-28 rounded-md opacity-70" />
              </div>
              <div className="flex flex-wrap gap-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`detail-metric-${index}`} className="space-y-2">
                    <div className="skeleton-shimmer h-6 w-14 rounded-md" />
                    <div className="skeleton-shimmer h-2.5 w-10 rounded-md opacity-60" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-5 flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`detail-tab-${index}`} className="skeleton-shimmer h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="surface-panel p-5 sm:p-6">
            <div className="skeleton-shimmer mb-5 h-3 w-24 rounded-md opacity-70" />
            <div className="skeleton-shimmer h-56 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="bg-system-background min-h-screen">
        <DetailHeader />
        <div className="relative container mx-auto max-w-6xl px-4 pt-20 pb-8 sm:px-6 lg:px-8">
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
  // Sport semantic colors for metrics (not brand accent)
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
      <DetailHeader />

      <div className="relative container mx-auto max-w-6xl px-4 pt-16 pb-6 sm:px-6 sm:pt-20 sm:pb-8 lg:px-8">
        {!activity.isIndoor && !skipMap && (
          <motion.section
            className="mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springs.smooth}
          >
            {/* Map + controls share one card so the bar never collides with the stats sheet */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-[rgb(var(--color-separator))]">
              <div className="relative h-[300px] sm:h-[400px]">
                <MapErrorBoundary>
                  <RunMap
                    className="h-full w-full"
                    bounds={bounds || undefined}
                    boundsPadding={48}
                    autoLoad={mapAutoLoad}
                  >
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
                          progress={animationProgress}
                          onProgressChange={setAnimationProgress}
                          onAnimationComplete={handleAnimationComplete}
                          speed={playbackSpeed}
                        />
                        <PlaybackMarker
                          current={currentPoint ?? (isPlaying ? startPoint : undefined)}
                          start={startPoint}
                          end={endPoint}
                          accentColor={currentPaceInfo?.color}
                        />
                        <KilometerMarkers
                          markers={kmMarkers}
                          metric={metricMode}
                          onSelect={handleSelectKilometer}
                        />
                      </Fragment>
                    ) : (
                      <Fragment key="static">
                        <PaceRouteLayer segments={paceSegments} activityId={activityId} />
                        <KilometerMarkers
                          markers={kmMarkers}
                          metric={metricMode}
                          onSelect={handleSelectKilometer}
                        />
                      </Fragment>
                    )}
                  </RunMap>
                </MapErrorBoundary>
              </div>

              <PlaybackControls
                isPlaying={isPlaying}
                progress={animationProgress}
                speed={playbackSpeed}
                averagePace={activity.averagePace || 360}
                currentPace={currentPaceInfo?.pace}
                currentDistanceMeters={currentPoint?.distance ?? 0}
                currentElapsedSeconds={elapsedSeconds}
                metric={metricMode}
                accentColor={currentPaceInfo?.color}
                onPlayPause={handlePlayPause}
                onStop={handleStopPlayback}
                onSeek={handleSeek}
                onSpeedChange={setPlaybackSpeed}
                className="rounded-none border-t border-[rgb(var(--color-separator))] shadow-none"
              />
            </div>
          </motion.section>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.06 }}
          className={cn(
            'px-5 py-4 sm:px-6 sm:py-5',
            !activity.isIndoor && !skipMap
              ? 'surface-panel relative z-10 mb-8'
              : 'premium-surface mb-8',
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-label min-w-0 flex-1 truncate text-lg font-medium tracking-tight sm:text-xl">
                  <span>{`${typeEmoji} ${activity.title || '跑步活动'}`}</span>
                </h1>
                <div className="relative shrink-0">
                  <motion.button
                    type="button"
                    onClick={() => setShowShareMenu((open) => !open)}
                    className="text-secondary-label hover:bg-system-fill hover:text-label flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    whileTap={pressable.whileTap}
                    transition={pressable.transition}
                    aria-label="分享与更多"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </motion.button>
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        className="premium-surface absolute top-9 right-0 z-30 w-48 overflow-hidden rounded-xl"
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={springs.snappy}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            void handleCopyLink()
                          }}
                          className="text-label hover:bg-system-fill flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm"
                        >
                          {linkCopied ? (
                            <Check className="text-green h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {linkCopied ? '已复制链接' : '复制链接'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowShareMenu(false)
                            if (navigator.share) {
                              void navigator.share({
                                title: activity.title || '跑步活动',
                                url: window.location.href,
                              })
                            }
                          }}
                          className="text-label hover:bg-system-fill flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm"
                        >
                          <Share2 className="text-accent h-4 w-4" />
                          系统分享
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-tertiary-label mt-1 text-xs sm:text-sm">
                {formatDate(activity.startTime)} {formatTime(activity.startTime)}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-x-5 gap-y-3 text-sm sm:gap-x-6">
              <button
                type="button"
                onClick={() => scrollToSection('splits')}
                className="hover:bg-system-fill/60 flex min-w-[3.5rem] flex-col rounded-lg px-1 py-0.5 text-left transition-colors"
              >
                <span className="font-data text-label text-lg font-medium tabular-nums sm:text-xl">
                  {(activity.distance / 1000).toFixed(2)}
                </span>
                <span className="text-tertiary-label text-[11px]">公里</span>
              </button>
              <div className="flex min-w-[3.5rem] flex-col">
                <span className="font-data text-label text-lg font-medium tabular-nums sm:text-xl">
                  {formatDuration(activity.duration)}
                </span>
                <span className="text-tertiary-label text-[11px]">时长</span>
              </div>
              {primaryMetricVisible && (
                <button
                  type="button"
                  onClick={() => scrollToSection('pace')}
                  className="hover:bg-system-fill/60 flex min-w-[3.5rem] flex-col rounded-lg px-1 py-0.5 text-left transition-colors"
                >
                  <span
                    className={cn(
                      'font-data text-lg font-medium tabular-nums sm:text-xl',
                      metricTextClassName,
                    )}
                  >
                    {primaryMetricValue}
                    {primaryMetricUnit && (
                      <span className={cn('ml-1 text-xs font-normal', metricSubTextClassName)}>
                        {primaryMetricUnit}
                      </span>
                    )}
                  </span>
                  <span className={cn('text-[11px]', metricSubTextClassName)}>
                    {primaryMetricTitle}
                  </span>
                </button>
              )}
              {activity.elevationGain !== null && activity.elevationGain > 0 && (
                <div className="flex min-w-[3.5rem] flex-col">
                  <span className="font-data text-label text-lg font-medium tabular-nums sm:text-xl">
                    ↗{activity.elevationGain.toFixed(0)}
                  </span>
                  <span className="text-tertiary-label text-[11px]">爬升</span>
                </div>
              )}
              {activity.averageHeartRate && (
                <button
                  type="button"
                  onClick={() => scrollToSection('heartrate')}
                  className="hover:bg-system-fill/60 flex min-w-[3.5rem] flex-col rounded-lg px-1 py-0.5 text-left transition-colors"
                >
                  <span className="font-data text-red text-lg font-medium tabular-nums sm:text-xl">
                    {activity.averageHeartRate}
                  </span>
                  <span className="text-red/60 text-[11px]">心率</span>
                </button>
              )}
              {activity.weatherData && <WeatherInfo weatherDataJson={activity.weatherData} />}
            </div>
          </div>
        </motion.div>

        {debugMode !== 'basic' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.12 }}
            className="space-y-8"
          >
            {/* Sticky section mini-nav */}
            <nav
              className="surface-glass sticky top-12 z-30 -mx-1 mb-2 overflow-x-auto rounded-full px-1.5 py-1.5"
              aria-label="详情分区"
            >
              <div className="flex min-w-max items-center gap-0.5">
                {(
                  [
                    {
                      id: 'pace',
                      label: `${metricLabel}分析`,
                      show: chartSplits.length > 0 || true,
                    },
                    {
                      id: 'heartrate',
                      label: '心率',
                      show: heartRateData.length > 0 || !!activity.averageHeartRate,
                    },
                    { id: 'splits', label: '分段', show: true },
                    { id: 'art', label: '艺术', show: true },
                    { id: 'ai', label: 'AI', show: true },
                    { id: 'more', label: '更多', show: !!activity.calories || !!activity.bestPace },
                  ] as const
                )
                  .filter((item) => item.show)
                  .map((item) => {
                    const active = activeSection === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                          active
                            ? 'bg-tertiary-system-background text-label shadow-[0_0_0_1px_rgb(var(--color-separator))]'
                            : 'text-tertiary-label hover:text-secondary-label',
                        )}
                        aria-current={active ? 'true' : undefined}
                      >
                        {item.label}
                      </button>
                    )
                  })}
              </div>
            </nav>

            {/* Pace / speed */}
            <section id="section-pace" className="scroll-mt-28 space-y-5">
              <div className="surface-panel p-5 sm:p-6">
                <h2 className="text-secondary-label mb-5 text-xs font-medium tracking-wide uppercase">
                  每公里{metricLabel}
                </h2>
                {chartSplits.length > 0 ? (
                  <PaceChart
                    splits={chartSplits}
                    averagePace={activity.averagePace || 360}
                    metric={metricMode}
                    activeKilometer={playbackKilometer}
                    onSelectKilometer={handleSelectKilometer}
                  />
                ) : (
                  <p className="text-secondary-label py-10 text-center text-sm">
                    {noMetricDataText}
                  </p>
                )}
              </div>
              {chartSplits.length > 0 && (
                <PaceDistribution
                  splits={chartSplits}
                  averagePace={activity.averagePace || 360}
                  metric={metricMode}
                />
              )}
            </section>

            {/* Heart rate */}
            {(heartRateData.length > 0 || activity.averageHeartRate) && (
              <section id="section-heartrate" className="scroll-mt-28 space-y-5">
                {heartRateData.length > 0 && (
                  <div className="surface-panel p-5 sm:p-6">
                    <h2 className="text-secondary-label mb-5 text-xs font-medium tracking-wide uppercase">
                      心率变化
                    </h2>
                    <HeartRateChart
                      data={heartRateData}
                      averageHeartRate={activity.averageHeartRate ?? undefined}
                      maxHeartRate={activity.maxHeartRate ?? undefined}
                    />
                  </div>
                )}
                {activity.averageHeartRate && activity.maxHeartRate && (
                  <HeartRateZones
                    averageHeartRate={activity.averageHeartRate}
                    maxHeartRate={activity.maxHeartRate}
                  />
                )}
              </section>
            )}

            {/* Splits */}
            <section id="section-splits" className="scroll-mt-28">
              <div className="surface-panel p-5 sm:p-6">
                <h2 className="text-secondary-label mb-5 text-xs font-medium tracking-wide uppercase">
                  分段数据
                  {selectedKm != null && (
                    <span className="text-accent ml-2 font-normal normal-case">
                      · 第 {selectedKm} 公里
                    </span>
                  )}
                </h2>
                {chartSplits.length > 0 ? (
                  <SplitsTable
                    splits={chartSplits}
                    metric={metricMode}
                    activeKilometer={playbackKilometer}
                    onSelectKilometer={handleSelectKilometer}
                  />
                ) : (
                  <p className="text-secondary-label py-10 text-center text-sm">暂无分段数据</p>
                )}
              </div>
            </section>

            {/* Art */}
            <section id="section-art" className="scroll-mt-28">
              <div className="mb-3">
                <h2 className="text-secondary-label text-xs font-medium tracking-wide uppercase">
                  艺术
                </h2>
              </div>
              <ArtGallery
                splits={chartSplits}
                trackPoints={trackPoints}
                paceSegments={paceSegments}
                kmMarkers={kmMarkers}
                heartRateData={heartRateData}
                activity={activity}
              />
            </section>

            {/* AI */}
            <section id="section-ai" className="scroll-mt-28">
              <div className="mb-3">
                <h2 className="text-secondary-label text-xs font-medium tracking-wide uppercase">
                  AI 分析
                </h2>
              </div>
              <AIInsight activityId={activityId} />
            </section>

            {/* More */}
            {(activity.calories || activity.bestPace) && (
              <section id="section-more" className="scroll-mt-28">
                <div className="surface-panel p-5 sm:p-6">
                  <h2 className="text-secondary-label mb-5 text-xs font-medium tracking-wide uppercase">
                    其他数据
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {activity.calories && (
                      <div className="bg-secondary-system-background/80 rounded-xl p-4">
                        <div className="text-tertiary-label text-[11px]">卡路里</div>
                        <div className="font-data text-label mt-1.5 text-2xl font-medium tabular-nums">
                          {activity.calories}
                          <span className="text-tertiary-label ml-1 text-sm font-normal">kcal</span>
                        </div>
                      </div>
                    )}
                    {activity.bestPace && (
                      <div className="bg-secondary-system-background/80 rounded-xl p-4">
                        <div className="text-tertiary-label text-[11px]">{bestMetricTitle}</div>
                        <div className="font-data text-label mt-1.5 text-2xl font-medium tabular-nums">
                          {isCycling
                            ? paceToSpeed(activity.bestPace).toFixed(1)
                            : formatPace(activity.bestPace)}
                          <span className="text-tertiary-label ml-1 text-sm font-normal">
                            {bestMetricUnit}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        )}

        <ActivityActionBar
          activityId={activityId}
          activityTitle={activity.title || '跑步活动'}
          mobileOnly
        />
      </div>
    </div>
  )
}

function DetailHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('surface-header fixed inset-x-0 top-0 z-40', scrolled && 'is-scrolled')}>
      <div className="container mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/logo-mark.png?v=1"
            alt="RunPaceFlow"
            width={28}
            height={28}
            priority
            unoptimized
            className="h-7 w-7 shrink-0 bg-transparent object-contain opacity-90 dark:invert"
          />
          <span className="font-display text-label text-sm font-medium tracking-tight transition-opacity group-hover:opacity-80">
            RunPaceFlow
          </span>
        </Link>
        <div className="flex min-h-9 items-center">{rightSlot}</div>
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
