/**
 * RunMap Component
 *
 * Main map component using MapLibre GL JS
 * Each instance manages its own viewport state (not shared globally)
 *
 * Reason: MapLibre WebGL initialization can freeze the browser tab on some
 * machines/GPU configs. The map now auto-mounts by default and keeps the
 * old click-to-load mode as an opt-out.
 */

'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Maximize2, Minimize2 } from 'lucide-react'
import type { StyleSpecification } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MapRef } from 'react-map-gl/maplibre'
import Map from 'react-map-gl/maplibre'

import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import type { MapViewport } from '@/types/map'

// Reason: MapLibre requires WebGL. Creating a canvas + WebGL context is
// expensive, so we cache the result at module level — check once per session.
let webglAvailable: boolean | null = null
function isWebGLAvailable(): boolean {
  if (webglAvailable !== null) return webglAvailable
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      webglAvailable = false
      return false
    }
    if (gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext) {
      webglAvailable = !gl.isContextLost()
      return webglAvailable
    }
    webglAvailable = false
    return false
  } catch {
    webglAvailable = false
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
  /** Auto-load map without requiring user click (default: true) */
  autoLoad?: boolean
  /** Runtime map style URL from the config center */
  mapStyleUrl?: string
  /** Force the map's visual theme when it sits inside a fixed-tone stage */
  appearance?: 'auto' | 'light' | 'dark'
}

const CARTO_LIGHT_MAP_STYLES = new Set([
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
])
const DEFAULT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const DEFAULT_DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

function resolveMapStyle(style: string, theme: 'light' | 'dark') {
  if (theme === 'dark' && CARTO_LIGHT_MAP_STYLES.has(style)) return DEFAULT_DARK_MAP_STYLE
  return style
}

// "No basemap" fallback style. This avoids external tile/style requests
// and guarantees the route still renders even if a CDN is blocked.
function createFallbackMapStyle(theme: 'light' | 'dark'): StyleSpecification {
  return {
    version: 8,
    name: 'blank',
    sources: {},
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': theme === 'dark' ? '#151b23' : '#f2f5f8' },
      },
    ],
  }
}

const MAP_GRID_BACKGROUND = `
  linear-gradient(to right, rgb(var(--color-label) / 0.07) 1px, transparent 1px),
  linear-gradient(to bottom, rgb(var(--color-label) / 0.07) 1px, transparent 1px)
`

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
  autoLoad = true,
  mapStyleUrl,
  appearance = 'auto',
}: RunMapProps) {
  const { resolvedTheme } = useTheme()
  const mapTheme = appearance === 'auto' ? resolvedTheme : appearance
  const mapRef = useRef<MapRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevBoundsRef = useRef<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [webglUnavailable, setWebglUnavailable] = useState(false)
  // Map mounts immediately by default; set autoLoad=false to use click-to-load mode.
  const [shouldMount, setShouldMount] = useState(autoLoad)
  const configuredMapStyle = resolveMapStyle(mapStyleUrl || DEFAULT_MAP_STYLE, mapTheme)
  const [fallbackStyleFor, setFallbackStyleFor] = useState<string | null>(null)
  const [lastStyleError, setLastStyleError] = useState<string | null>(null)
  const fallbackStyleActive = fallbackStyleFor === configuredMapStyle
  const mapStyle = fallbackStyleActive ? createFallbackMapStyle(mapTheme) : configuredMapStyle

  // Check WebGL support on mount before attempting MapLibre init
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!isWebGLAvailable()) setWebglUnavailable(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Generate a key for current bounds
  const boundsKey = bounds
    ? `${bounds.minLng.toFixed(6)},${bounds.maxLng.toFixed(6)},${bounds.minLat.toFixed(6)},${bounds.maxLat.toFixed(6)}`
    : null
  const minLng = bounds?.minLng
  const maxLng = bounds?.maxLng
  const minLat = bounds?.minLat
  const maxLat = bounds?.maxLat

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

  const fitToBounds = useCallback(
    (padding: number, duration: number) => {
      if (
        minLng === undefined ||
        maxLng === undefined ||
        minLat === undefined ||
        maxLat === undefined
      ) {
        return
      }

      mapRef.current?.getMap()?.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding, duration },
      )
    },
    [maxLat, maxLng, minLat, minLng],
  )

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
        fitToBounds(isFullscreen ? 80 : boundsPadding, 300)
      }, 100)
      return () => clearTimeout(timer)
    }
    return
  }, [isFullscreen, boundsPadding, fitToBounds])

  // Fit bounds when they change
  useEffect(() => {
    if (!boundsKey) return

    // Check if bounds actually changed
    if (prevBoundsRef.current === boundsKey) return
    prevBoundsRef.current = boundsKey

    // Call fitBounds on the map if it's ready
    if (mapRef.current?.getMap()) {
      // Use requestAnimationFrame to ensure map is ready
      requestAnimationFrame(() => {
        fitToBounds(boundsPadding, 0)
      })
    }
  }, [boundsKey, boundsPadding, fitToBounds])

  const retryBasemap = useCallback(() => {
    setFallbackStyleFor(null)
    setLastStyleError(null)
    setIsMapLoaded(false)
  }, [])

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true)
    // Fit bounds immediately after map loads
    if (boundsKey) {
      fitToBounds(boundsPadding, 0)
      // Update ref to mark bounds as fitted
      prevBoundsRef.current = boundsKey
    }
  }, [boundsKey, boundsPadding, fitToBounds])

  const shouldTreatAsFatal = useCallback((error: Error): boolean => {
    const message = error.message.toLowerCase()
    // WebGL / GPU errors are the ones that can crash or freeze the tab.
    // Network errors (tiles/style) should never crash the whole page.
    if (message.includes('webgl') || message.includes('context lost')) return true
    if (message.includes('failed to initialize') && message.includes('gl')) return true
    return false
  }, [])

  // MapLibre emits "error" events for many recoverable cases (tiles, sprites, glyphs).
  // Throwing on any error makes the map unusable on networks where the basemap CDN is blocked.
  const handleError = useCallback(
    (evt: { error: Error }) => {
      const { error } = evt
      console.error('[RunMap] MapLibre error:', error)

      if (shouldTreatAsFatal(error)) {
        // Let MapErrorBoundary catch fatal init failures.
        throw error
      }

      const message = error.message ?? ''
      const messageLower = message.toLowerCase()

      const isNetworkish =
        messageLower.includes('failed to fetch') ||
        messageLower.includes('networkerror') ||
        messageLower.includes('load failed') ||
        messageLower.includes('fetch') ||
        messageLower.includes('timeout')

      // If the basemap cannot be loaded, automatically fall back to a blank style so
      // the route still renders. (This is common behind corporate proxies or in CN.)
      if (
        isNetworkish &&
        !fallbackStyleActive &&
        !isMapLoaded &&
        configuredMapStyle.startsWith('http')
      ) {
        setLastStyleError(message)
        setFallbackStyleFor(configuredMapStyle)
        return
      }

      // Otherwise: keep the map running. Tile errors are expected occasionally.
    },
    [configuredMapStyle, fallbackStyleActive, isMapLoaded, shouldTreatAsFatal],
  )

  // WebGL unavailable fallback
  if (webglUnavailable) {
    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="border-separator bg-secondary-system-background flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border">
          <div className="bg-orange/10 flex h-12 w-12 items-center justify-center rounded-full">
            <MapPin className="text-orange h-6 w-6" />
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
        <div className="border-separator bg-secondary-system-background absolute inset-0 overflow-hidden rounded-lg border">
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: MAP_GRID_BACKGROUND,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Load map button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShouldMount(true)}
              className="border-separator bg-tertiary-system-background hover:bg-system-background flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors"
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
        <div className="border-separator bg-secondary-system-background absolute inset-0 z-10 overflow-hidden rounded-lg border">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: MAP_GRID_BACKGROUND,
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
        initialViewState={calculatedViewport}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={false}
        reuseMaps={false}
      >
        {children}
      </Map>

      {/* Fullscreen toggle button */}
      {enableFullscreen && isMapLoaded && (
        <motion.button
          type="button"
          onClick={toggleFullscreen}
          className={cn(
            'border-separator bg-tertiary-system-background/92 hover:bg-tertiary-system-background absolute z-20 flex items-center justify-center rounded-lg border p-2 shadow-sm backdrop-blur-xl transition-colors',
            isFullscreen ? 'top-4 right-4' : 'top-3 right-3',
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

      {/* Basemap fallback banner */}
      {fallbackStyleActive && (
        <div className="border-separator bg-tertiary-system-background/92 absolute top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-lg border px-3 py-2 text-xs shadow-sm backdrop-blur-xl">
          <div className="text-label/70">
            <span>底图加载失败，已切换到简洁模式</span>
            {lastStyleError && <span>（网络受限）</span>}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={retryBasemap}
              className="text-blue hover:text-blue/80 text-xs font-medium transition-colors"
            >
              重试底图
            </button>
            <span className="text-label/20">·</span>
            <span className="text-label/40 text-[11px]">路线仍可正常查看</span>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Normal view */}
      <div ref={containerRef} className={cn('relative', className, isFullscreen && 'invisible')}>
        {!isFullscreen && mapContent}
      </div>

      {/* Fullscreen overlay — portaled to <body> so page-level stacking contexts
          (animated wrappers, z-indexed sections) can't trap it below the fixed
          header / action bar. */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isFullscreen && (
              <motion.div
                className="bg-system-background fixed inset-0 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Close hint */}
                <motion.div
                  className="border-separator bg-tertiary-system-background/92 text-secondary-label absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-sm backdrop-blur-xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  按 ESC 退出全屏
                </motion.div>

                <div className="relative h-full w-full">{mapContent}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
