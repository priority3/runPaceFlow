/**
 * RouteLayer Component
 *
 * Displays running routes on the map
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
        const geojson = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: route.coordinates.map((coord) => [
              coord.longitude,
              coord.latitude,
            ]),
          },
        }

        return (
          <Source
            key={route.id}
            id={`route-${route.id}`}
            type="geojson"
            data={geojson}
          >
            <Layer
              id={`route-line-${route.id}`}
              type="line"
              paint={{
                'line-color': route.color || '#3b82f6',
                'line-width': route.width || 3,
                'line-opacity': 0.8,
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
