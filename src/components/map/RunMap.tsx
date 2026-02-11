/**
 * RunMap Component
 *
 * Main map component using MapLibre GL JS
 * Each instance manages its own viewport state (not shared globally)
 *
 * Reason: MapLibre WebGL initialization can freeze the browser tab on some
 * machines/GPU configs. The map is deferred behind a "load map" click to
 * guarantee the rest of the page stays responsive.
 */

'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import Map from 'react-map-gl/maplibre'

import { cn } from '@/lib/utils'
import type { MapViewport } from '@/types/map'

// Reason: MapLibre requires WebGL. If WebGL is unavailable or broken,
// attempting to initialize the map can freeze the browser tab entirely.
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    if (gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext) {
      return !gl.isContextLost()
    }
    return false
  } catch {
    return false
  }
}

export interface RunMapProps {
  className?: string
  children?: React.ReactNode
  /** Initial viewport */
  initialViewport?: Partial<MapViewport>
  /** Bounds to fit - will override initialViewport */
  bounds?: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
  /** Padding for fitBounds */
  boundsPadding?: number
  /** Show loading skeleton */
  showSkeleton?: boolean
  /** Enable fullscreen button */
  enableFullscreen?: boolean
  /** Auto-load map without requiring user click (default: false) */
  autoLoad?: boolean
}

// Use environment variable or fallback to a clean, minimal style
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ||
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const DEFAULT_VIEW_STATE: MapViewport = {
  longitude: 116.397428,
  latitude: 39.90923,
  zoom: 12,
  pitch: 0,
  bearing: 0,
}

export function RunMap({
  className,
  children,
  initialViewport,
  bounds,
  boundsPadding = 60,
  showSkeleton = true,
  enableFullscreen = true,
  autoLoad = false,
}: RunMapProps) {
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevBoundsRef = useRef<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [webglUnavailable, setWebglUnavailable] = useState(false)
  // Reason: Map starts unmounted to prevent WebGL init from freezing the page.
  // User must click "加载地图" to mount MapLibre, unless autoLoad is true.
  const [shouldMount, setShouldMount] = useState(autoLoad)

  // Check WebGL support on mount before attempting MapLibre init
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglUnavailable(true)
    }
  }, [])

  // Generate a key for current bounds
  const boundsKey = bounds
    ? `${bounds.minLng.toFixed(6)},${bounds.maxLng.toFixed(6)},${bounds.minLat.toFixed(6)},${bounds.maxLat.toFixed(6)}`
    : null

  // Calculate viewport from bounds if provided
  const calculatedViewport = useMemo(() => {
    if (bounds) {
      const centerLng = (bounds.minLng + bounds.maxLng) / 2
      const centerLat = (bounds.minLat + bounds.maxLat) / 2
      const lngSpan = bounds.maxLng - bounds.minLng
      const latSpan = bounds.maxLat - bounds.minLat
      const maxSpan = Math.max(lngSpan, latSpan)

      // Calculate appropriate zoom level
      let zoom = 14
      if (maxSpan > 0.1) zoom = 11
      else if (maxSpan > 0.05) zoom = 12
      else if (maxSpan > 0.02) zoom = 13
      else if (maxSpan > 0.01) zoom = 14
      else zoom = 15

      return {
        longitude: centerLng,
        latitude: centerLat,
        zoom,
        pitch: 0,
        bearing: 0,
      }
    }
    return { ...DEFAULT_VIEW_STATE, ...initialViewport }
  }, [bounds, initialViewport])

  const [viewport, setViewport] = useState<MapViewport>(calculatedViewport)

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when fullscreen
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  // Resize map when entering/exiting fullscreen
  useEffect(() => {
    if (mapRef.current) {
      // Trigger resize after animation
      const timer = setTimeout(() => {
        mapRef.current?.resize()
        // Re-fit bounds after resize
        if (bounds) {
          const map = mapRef.current?.getMap()
          map?.fitBounds(
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
            ],
            {
              padding: isFullscreen ? 80 : boundsPadding,
              duration: 300,
            },
          )
        }
      }, 100)
      return () => clearTimeout(timer)
    }
    return
  }, [isFullscreen, bounds, boundsPadding])

  // Fit bounds when they change
  useEffect(() => {
    if (!bounds || !boundsKey) return

    // Check if bounds actually changed
    if (prevBoundsRef.current === boundsKey) return
    prevBoundsRef.current = boundsKey

    // Update viewport state
    setViewport(calculatedViewport)

    // Call fitBounds on the map if it's ready
    const map = mapRef.current?.getMap()
    if (map) {
      // Use requestAnimationFrame to ensure map is ready
      requestAnimationFrame(() => {
        map.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          {
            padding: boundsPadding,
            duration: 0,
          },
        )
      })
    }
  }, [bounds, boundsKey, boundsPadding, calculatedViewport])

  const handleMove = useCallback((evt: { viewState: MapViewport }) => {
    setViewport({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      pitch: evt.viewState.pitch ?? 0,
      bearing: evt.viewState.bearing ?? 0,
    })
  }, [])

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true)
    // Fit bounds immediately after map loads
    if (bounds && mapRef.current) {
      const map = mapRef.current.getMap()
      if (map) {
        map.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          {
            padding: boundsPadding,
            duration: 0,
          },
        )
        // Update ref to mark bounds as fitted
        prevBoundsRef.current = boundsKey
      }
    }
  }, [bounds, boundsKey, boundsPadding])

  // Reason: MapLibre WebGL errors can crash the entire browser tab.
  // Re-throwing lets the parent MapErrorBoundary catch and show fallback UI.
  const handleError = useCallback((evt: { error: Error }) => {
    console.error('[RunMap] MapLibre error:', evt.error)
    throw evt.error
  }, [])

  // WebGL unavailable fallback
  if (webglUnavailable) {
    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-gray-100 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <MapPin className="h-6 w-6 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-label text-sm font-medium">地图无法显示</p>
            <p className="text-label/50 mt-1 max-w-xs text-xs">浏览器不支持 WebGL，无法渲染地图</p>
          </div>
        </div>
      </div>
    )
  }

  // "Click to load" placeholder - shown before user opts in to mount MapLibre
  if (!shouldMount) {
    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Load map button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShouldMount(true)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-5 py-2.5 text-sm font-medium backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/60"
            >
              <MapPin className="text-blue h-4 w-4" />
              <span className="text-label">加载地图</span>
            </button>
            <span className="text-label/30 text-xs">点击加载路线地图</span>
          </div>

          {/* Decorative route preview */}
          <svg
            className="absolute inset-0 h-full w-full opacity-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 20 80 Q 30 60 40 50 T 60 40 T 80 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-blue"
            />
          </svg>
        </div>
      </div>
    )
  }

  const mapContent = (
    <>
      {/* Map skeleton loading state */}
      {showSkeleton && !isMapLoaded && (
        <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
            animate={{
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 100%' }}
          />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Center loading indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              className="bg-blue/10 flex h-12 w-12 items-center justify-center rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <MapPin className="text-blue h-6 w-6" />
            </motion.div>
            <motion.span
              className="text-label/50 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              加载地图中...
            </motion.span>
          </div>

          {/* Fake route preview - uses viewBox coordinates, not percentages */}
          <svg
            className="absolute inset-0 h-full w-full opacity-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 20 80 Q 30 60 40 50 T 60 40 T 80 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-blue"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewport}
        onMove={handleMove}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        reuseMaps
      >
        {children}
      </Map>

      {/* Fullscreen toggle button */}
      {enableFullscreen && isMapLoaded && (
        <motion.button
          type="button"
          onClick={toggleFullscreen}
          className={cn(
            'absolute z-20 flex items-center justify-center rounded-lg border border-white/20 bg-white/80 p-2 shadow-sm backdrop-blur-xl transition-colors hover:bg-white dark:border-white/10 dark:bg-black/60 dark:hover:bg-black/80',
            isFullscreen ? 'top-4 right-4' : 'right-3 bottom-3',
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={isFullscreen ? '退出全屏 (ESC)' : '全屏查看'}
        >
          {isFullscreen ? (
            <Minimize2 className="text-label h-4 w-4" />
          ) : (
            <Maximize2 className="text-label h-4 w-4" />
          )}
        </motion.button>
      )}
    </>
  )

  return (
    <>
      {/* Normal view */}
      <div ref={containerRef} className={cn('relative', className, isFullscreen && 'invisible')}>
        {!isFullscreen && mapContent}
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close hint */}
            <motion.div
              className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm text-white/70 backdrop-blur-xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              按 ESC 退出全屏
            </motion.div>

            <div className="relative h-full w-full">{mapContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
