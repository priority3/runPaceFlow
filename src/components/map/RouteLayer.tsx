/**
 * RouteLayer Component
 *
 * Displays running routes on the map with glow effect
 * Optimized: Uses a single GeoJSON Source with multiple LineString features,
 * allowing hover/click interactions per route without mounting N Sources.
 */

'use client'

import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

import type { RouteData } from '@/types/map'

export interface RouteLayerProps {
  routes: RouteData[]
  /** Highlight a single route on hover/selection */
  highlightRouteId?: string | null
  /** Highlight color (defaults to iOS mint) */
  highlightColor?: string
}

const DEFAULT_HIGHLIGHT = '#00C7BE'

export function RouteLayer({
  routes,
  highlightRouteId,
  highlightColor = DEFAULT_HIGHLIGHT,
}: RouteLayerProps) {
  const routesGeoJson = useMemo(() => {
    if (!routes || routes.length === 0) return null

    const validRoutes = routes.filter((route) => route.coordinates && route.coordinates.length >= 2)
    if (validRoutes.length === 0) return null

    const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
      type: 'FeatureCollection',
      features: validRoutes.map((route) => ({
        type: 'Feature',
        properties: { id: route.id },
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates.map((coord) => [coord.longitude, coord.latitude]),
        },
      })),
    }

    return geojson
  }, [routes])

  const highlightFilter = useMemo(() => {
    if (!highlightRouteId) return null
    return ['==', ['get', 'id'], highlightRouteId] as const
  }, [highlightRouteId])

  if (!routesGeoJson) {
    return null
  }

  return (
    <>
      <Source id="routes" type="geojson" data={routesGeoJson}>
        {/* Wide hitbox layer for hover interactions (invisible) */}
        <Layer
          id="routes-hitbox"
          type="line"
          paint={{
            'line-color': '#000000',
            'line-width': 16,
            'line-opacity': 0,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />

        {/* Base routes (subtle) */}
        <Layer
          id="routes-glow"
          type="line"
          paint={{
            'line-color': '#6B7280',
            'line-width': 7,
            'line-opacity': 0.1,
            'line-blur': 3,
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
            'line-color': '#6B7280',
            'line-width': 2.5,
            'line-opacity': 0.7,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />

        {/* Highlight route overlay */}
        {highlightFilter && (
          <>
            <Layer
              id="route-highlight-glow"
              type="line"
              filter={highlightFilter as any}
              paint={{
                'line-color': highlightColor,
                'line-width': 10,
                'line-opacity': 0.12,
                'line-blur': 4,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
            <Layer
              id="route-highlight-line"
              type="line"
              filter={highlightFilter as any}
              paint={{
                'line-color': highlightColor,
                'line-width': 4,
                'line-opacity': 0.95,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </>
        )}
      </Source>
    </>
  )
}
