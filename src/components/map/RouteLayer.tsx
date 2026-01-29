/**
 * RouteLayer Component
 *
 * Displays running routes on the map with glow effect
 */

'use client'

import { Layer, Source } from 'react-map-gl/maplibre'

import type { RouteData } from '@/types/map'

export interface RouteLayerProps {
  routes: RouteData[]
}

export function RouteLayer({ routes }: RouteLayerProps) {
  if (!routes || routes.length === 0) {
    return null
  }

  return (
    <>
      {routes.map((route) => {
        // Skip routes with no coordinates
        if (!route.coordinates || route.coordinates.length < 2) {
          return null
        }

        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {
            routeId: route.id,
          },
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates.map((coord) => [coord.longitude, coord.latitude]),
          },
        }

        return (
          <Source key={route.id} id={`route-${route.id}`} type="geojson" data={geojson}>
            {/* Glow effect layer (behind main line) */}
            <Layer
              id={`route-glow-${route.id}`}
              type="line"
              paint={{
                'line-color': route.color || '#374151',
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
              id={`route-line-${route.id}`}
              type="line"
              paint={{
                'line-color': route.color || '#374151',
                'line-width': route.width || 3,
                'line-opacity': 0.85,
              }}
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
            />
          </Source>
        )
      })}
    </>
  )
}
