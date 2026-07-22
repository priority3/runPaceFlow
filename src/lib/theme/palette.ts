export const SPORT_COLORS = {
  running: '#2457c5',
  cycling: '#b9472d',
} as const

export const DARK_SPORT_COLORS = {
  running: '#78a6ff',
  cycling: '#ff8a70',
} as const

export const TRAINING_COLORS = {
  heart: '#b93838',
  routeMono: '#18212f',
  success: '#187a5b',
} as const

export const DARK_TRAINING_COLORS = {
  heart: '#ff7b7b',
  routeMono: '#f2f5f8',
  success: '#5fd0a5',
} as const

export const PACE_COLORS = {
  veryFast: '#2457c5',
  fast: '#6f8edb',
  average: '#7c8797',
  slow: '#d27a57',
  verySlow: '#b93838',
} as const

export const DARK_PACE_COLORS = {
  veryFast: '#78a6ff',
  fast: '#9abaff',
  average: '#9aa5b1',
  slow: '#ffab91',
  verySlow: '#ff7b7b',
} as const

export const PACE_COLOR_VARS = {
  veryFast: 'var(--rpf-pace-very-fast)',
  fast: 'var(--rpf-pace-fast)',
  average: 'var(--rpf-pace-average)',
  slow: 'var(--rpf-pace-slow)',
  verySlow: 'var(--rpf-pace-very-slow)',
} as const

export const HEART_RATE_ZONE_COLORS = [
  '#7c8797',
  '#3f70c9',
  '#6d5f86',
  '#b9472d',
  '#b93838',
] as const

export const HEART_RATE_ZONE_COLOR_VARS = [
  'var(--rpf-heart-zone-1)',
  'var(--rpf-heart-zone-2)',
  'var(--rpf-heart-zone-3)',
  'var(--rpf-heart-zone-4)',
  'var(--rpf-heart-zone-5)',
] as const

export type PaletteMode = 'light' | 'dark'

export function getSportColors(mode: PaletteMode) {
  return mode === 'dark' ? DARK_SPORT_COLORS : SPORT_COLORS
}

export function getTrainingColors(mode: PaletteMode) {
  return mode === 'dark' ? DARK_TRAINING_COLORS : TRAINING_COLORS
}

export function getPaceColors(mode: PaletteMode) {
  return mode === 'dark' ? DARK_PACE_COLORS : PACE_COLORS
}
