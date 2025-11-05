/**
 * Map State Atoms
 *
 * Map-related state management using Jotai
 */

import { atom } from 'jotai'

/**
 * Map viewport state
 */
export interface MapViewport {
  longitude: number
  latitude: number
  zoom: number
  pitch?: number
  bearing?: number
}

export const mapViewportAtom = atom<MapViewport>({
  longitude: 116.397428, // Beijing
  latitude: 39.90923,
  zoom: 10,
  pitch: 0,
  bearing: 0,
})

/**
 * Currently playing activity route animation
 */
export const playingActivityIdAtom = atom<string | null>(null)

/**
 * Route animation playing state
 */
export const isPlayingAtom = atom(false)

/**
 * Route animation progress (0-100)
 */
export const animationProgressAtom = atom(0)

/**
 * Whether to show all routes on the map
 */
export const showAllRoutesAtom = atom(true)
