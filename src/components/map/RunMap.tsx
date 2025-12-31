/**
 * RunMap Component
 *
 * Main map component using MapLibre GL JS
 * Each instance manages its own viewport state (not shared globally)
 */

'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { type MapRef } from 'react-map-gl/maplibre'

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
  const boundsKeyRef = useRef<string>('')

  // Calculate initial viewport from bounds if provided
  const calculatedInitialViewport = useMemo(() => {
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

  const [viewport, setViewport] = useState<MapViewport>(calculatedInitialViewport)

  // Update viewport when bounds change (for page navigation)
  useEffect(() => {
    if (bounds) {
      const newKey = `${bounds.minLng},${bounds.maxLng},${bounds.minLat},${bounds.maxLat}`
      if (boundsKeyRef.current !== newKey) {
        boundsKeyRef.current = newKey
        setViewport(calculatedInitialViewport)

        // Also call fitBounds if map is ready
        if (mapRef.current) {
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
          }
        }
      }
    }
  }, [bounds, boundsPadding, calculatedInitialViewport])

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
        // Update ref to prevent duplicate fitting
        boundsKeyRef.current = `${bounds.minLng},${bounds.maxLng},${bounds.minLat},${bounds.maxLat}`
      }
    }
  }, [bounds, boundsPadding])

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
