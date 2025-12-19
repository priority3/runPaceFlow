/**
 * RunMap Component
 *
 * Main map component using MapLibre GL JS
 */

'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import Map from 'react-map-gl/maplibre'

import { mapViewportAtom } from '@/stores/map'
import type { MapViewport } from '@/types/map'

export interface RunMapProps {
  className?: string
  children?: React.ReactNode
}

// Use environment variable or fallback to a clean, minimal style
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ||
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

const INITIAL_VIEW_STATE = {
  longitude: 116.397428, // Beijing
  latitude: 39.90923,
  zoom: 12,
  pitch: 0,
  bearing: 0,
}

export function RunMap({ className, children }: RunMapProps) {
  const [viewport, setViewport] = useAtom(mapViewportAtom)
  const [mapReady, setMapReady] = useState(false)

  const handleMove = (evt: any) => {
    const newViewport: MapViewport = {
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      pitch: evt.viewState.pitch,
      bearing: evt.viewState.bearing,
    }
    setViewport(newViewport)
  }

  useEffect(() => {
    // Set initial viewport if not set
    if (viewport.longitude === 116.397428 && viewport.latitude === 39.90923) {
      setViewport(INITIAL_VIEW_STATE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={className}>
      <Map
        {...viewport}
        onMove={handleMove}
        onLoad={() => setMapReady(true)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        {mapReady && children}
      </Map>
    </div>
  )
}
