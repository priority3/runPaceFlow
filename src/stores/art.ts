/**
 * Art State Atoms
 *
 * State management for algorithmic art features using Jotai
 */

import { atom } from 'jotai'

import type { ArtTheme } from '@/lib/art/colors'
import type { SocialPreset } from '@/lib/art/export'

/**
 * Art visualization types
 */
export type ArtType = 'fingerprint' | 'flowfield' | 'constellation'

/**
 * Fingerprint display mode
 */
export type FingerprintMode = 'pace' | 'heartrate' | 'elevation'

/**
 * Currently selected art type
 */
export const selectedArtTypeAtom = atom<ArtType>('fingerprint')

/**
 * Fingerprint visualization settings
 */
export interface FingerprintSettings {
  mode: FingerprintMode
  rotation: number // degrees
  scale: number // 0.5 - 2
  showRadialLines: boolean
  animateRotation: boolean
}

export const fingerprintSettingsAtom = atom<FingerprintSettings>({
  mode: 'pace',
  rotation: 0,
  scale: 1,
  showRadialLines: true,
  animateRotation: false,
})

/**
 * Flow field visualization settings
 */
export interface FlowFieldSettings {
  isPlaying: boolean
  speed: number // 0.5 - 3
  particleCount: number // 100 - 1000
  trailLength: number // 5 - 50
  colorByPace: boolean
}

export const flowFieldSettingsAtom = atom<FlowFieldSettings>({
  isPlaying: false,
  speed: 1,
  particleCount: 300,
  trailLength: 20,
  colorByPace: true,
})

/**
 * Constellation visualization settings
 */
export interface ConstellationSettings {
  showLabels: boolean
  showConnections: boolean
  starSize: number // 1 - 5
  twinkle: boolean
  rotationX: number // degrees
  rotationY: number // degrees
}

export const constellationSettingsAtom = atom<ConstellationSettings>({
  showLabels: true,
  showConnections: true,
  starSize: 2,
  twinkle: true,
  rotationX: 0,
  rotationY: 0,
})

/**
 * Global art settings
 */
export interface GlobalArtSettings {
  theme: ArtTheme
  exportPreset: SocialPreset
  showWatermark: boolean
}

export const globalArtSettingsAtom = atom<GlobalArtSettings>({
  theme: 'default',
  exportPreset: 'instagram',
  showWatermark: true,
})

/**
 * Export state
 */
export interface ExportState {
  isExporting: boolean
  progress: number // 0-100
}

export const exportStateAtom = atom<ExportState>({
  isExporting: false,
  progress: 0,
})

/**
 * Derived atom for checking if any animation is playing
 */
export const isAnyAnimationPlayingAtom = atom((get) => {
  const fingerprint = get(fingerprintSettingsAtom)
  const flowField = get(flowFieldSettingsAtom)
  const constellation = get(constellationSettingsAtom)

  return fingerprint.animateRotation || flowField.isPlaying || constellation.twinkle
})
