/**
 * RouteLayer Component
 *
 * Displays running routes on the map with glow effect
 * Optimized: Combines all routes into a single MultiLineString for better performance
 */

'use client'

import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import type { RouteData } from '@/types/map'

export interface RouteLayerProps {
  routes: RouteData[]
}

export function RouteLayer({ routes }: RouteLayerProps) {
  // Combine all routes into a single MultiLineString GeoJSON
  const combinedGeoJson = useMemo(() => {
    if (!routes || routes.length === 0) return null

    const validRoutes = routes.filter((route) => route.coordinates && route.coordinates.length >= 2)

    if (validRoutes.length === 0) return null

    const geojson: GeoJSON.Feature<GeoJSON.MultiLineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiLineString',
        coordinates: validRoutes.map((route) =>
          route.coordinates.map((coord) => [coord.longitude, coord.latitude]),
        ),
      },
    }

    return geojson
  }, [routes])

  if (!combinedGeoJson) {
    return null
  }

  return (
    <Source id="routes-combined" type="geojson" data={combinedGeoJson}>
      {/* Glow effect layer (behind main line) */}
      <Layer
        id="routes-glow"
        type="line"
        paint={{
          'line-color': '#374151',
          'line-width': 8,
          'line-opacity': 0.15,
          'line-blur': 4,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />

      {/* Main route line */}
      <Layer
        id="routes-line"
        type="line"
        paint={{
          'line-color': '#374151',
          'line-width': 3,
          'line-opacity': 0.85,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  )
}
