/**
 * Map Types
 *
 * Type definitions for map-related components and data structures
 */

import type { LngLatBoundsLike } from 'maplibre-gl'

/**
 * GPS Coordinate
 */
export interface Coordinate {
  longitude: number
  latitude: number
  elevation?: number
  time?: Date
}

/**
 * Route data for map display
 */
export interface RouteData {
  id: string
  coordinates: Coordinate[]
  color?: string
  width?: number
}

/**
 * Map viewport state
 */
export interface MapViewport {
  longitude: number
  latitude: number
  zoom: number
  pitch?: number
  bearing?: number
  bounds?: LngLatBoundsLike
}

/**
 * Pace data for route visualization
 */
export interface PacePoint {
  coordinate: Coordinate
  pace: number // seconds/km
  distance: number // meters from start
  color: string // hex color based on pace
}
