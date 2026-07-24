/**
 * Semantic training colors — Yohaku 和色, muted for paper charts.
 * Keep in sync with --rpf-* in src/styles/globals.css.
 *
 * 縹 soft  #4a6f94  cool / fast / running
 * 若竹 soft #6a9a80  aerobic / success
 * 朽葉 soft #9a7a4a  warm / cycling / threshold
 * 蘇芳 soft #9a5a62  stress / heart / slow
 * Neutrals  #b0aea6…#403f3a for mid / route mono
 */

export const SPORT_COLORS = {
  running: '#4a6f94',
  cycling: '#9a7a4a',
} as const

export const DARK_SPORT_COLORS = {
  running: '#8aafd0',
  cycling: '#c4a878',
} as const

export const TRAINING_COLORS = {
  heart: '#9a5a62',
  routeMono: '#403f3a',
  success: '#6a9a80',
} as const

export const DARK_TRAINING_COLORS = {
  heart: '#c88890',
  routeMono: '#e8e8ea',
  success: '#88b8a0',
} as const

/** Pace relative-to-average scale used by charts + map. */
export const PACE_COLORS = {
  veryFast: '#4a6f94',
  fast: '#6a84a0',
  average: '#9a9890',
  slow: '#b09060',
  verySlow: '#9a5a62',
} as const

export const DARK_PACE_COLORS = {
  veryFast: '#8aafd0',
  fast: '#a0bdd8',
  average: '#a8a8b0',
  slow: '#c8b080',
  verySlow: '#c88890',
} as const

export const PACE_COLOR_VARS = {
  veryFast: 'var(--rpf-pace-very-fast)',
  fast: 'var(--rpf-pace-fast)',
  average: 'var(--rpf-pace-average)',
  slow: 'var(--rpf-pace-slow)',
  verySlow: 'var(--rpf-pace-very-slow)',
} as const

/** Z1 rest → Z5 anaerobic */
export const HEART_RATE_ZONE_COLORS = [
  '#b0aea6',
  '#6a9a80',
  '#4a6f94',
  '#9a7a4a',
  '#9a5a62',
] as const

export const HEART_RATE_ZONE_COLOR_VARS = [
  'var(--rpf-heart-zone-1)',
  'var(--rpf-heart-zone-2)',
  'var(--rpf-heart-zone-3)',
  'var(--rpf-heart-zone-4)',
  'var(--rpf-heart-zone-5)',
] as const

/** Brand accent — UI chrome only (buttons, focus, links). */
export const BRAND_ACCENT = {
  light: '#33A6B8',
  dark: '#F596AA',
} as const

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

export function getBrandAccent(mode: PaletteMode) {
  return mode === 'dark' ? BRAND_ACCENT.dark : BRAND_ACCENT.light
}
