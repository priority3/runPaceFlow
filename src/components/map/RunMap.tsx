/**
 * RunMap Component
 *
 * Main map component using MapLibre GL JS
 * Each instance manages its own viewport state (not shared globally)
 */

'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import Map from 'react-map-gl/maplibre'

import type { MapViewport } from '@/types/map'

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
}: RunMapProps) {
  const mapRef = useRef<MapRef>(null)
  const prevBoundsRef = useRef<string | null>(null)

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

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        {...viewport}
        onMove={handleMove}
        onLoad={handleLoad}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        reuseMaps
      >
        {children}
      </Map>
    </div>
  )
}
