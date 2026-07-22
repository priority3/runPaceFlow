/**
 * RouteLayer Component
 *
 * Displays routes on the map with glow effect
 * Optimized: Uses a single source while keeping per-route styling.
 */

'use client'

import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import { SPORT_COLORS } from '@/lib/theme/palette'
import type { RouteData } from '@/types/map'

export interface RouteLayerProps {
  routes: RouteData[]
}

export function RouteLayer({ routes }: RouteLayerProps) {
  const routesGeoJson = useMemo(() => {
    if (!routes || routes.length === 0) return null

    const validRoutes = routes.filter((route) => route.coordinates && route.coordinates.length >= 2)

    if (validRoutes.length === 0) return null

    const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: validRoutes.map((route) => ({
        type: 'Feature',
        properties: {
          id: route.id,
          color: route.color ?? SPORT_COLORS.running,
          width: route.width ?? 3,
        },
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates.map((coord) => [coord.longitude, coord.latitude]),
        },
      })),
    }

    return geojson
  }, [routes])

  if (!routesGeoJson) {
    return null
  }

  return (
    <Source id="routes-combined" type="geojson" data={routesGeoJson}>
      {/* Glow effect layer (behind main line) */}
      <Layer
        id="routes-glow"
        type="line"
        paint={{
          'line-color': ['get', 'color'],
          'line-width': ['+', ['get', 'width'], 6],
          'line-opacity': 0.22,
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
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': 0.9,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  )
}
