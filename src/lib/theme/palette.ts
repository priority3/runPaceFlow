/**
 * Semantic training colors — pr-ui.
 *
 * 图表不用彩色图例：一条线用墨色，最多一条用强调色。
 * 配速 / 心率区间用「同一种墨的不同明度」表达强度，跟字阶的 alpha 分层是同一支笔。
 * Keep in sync with --rpf-* in src/styles/globals.css.
 *
 * 生成艺术（art/）的可选调色板属于「内容用色」，不在此收敛，见 lib/art/colors.ts。
 */

/** 地图路线：跑步深墨、骑行浅墨，靠明度 + 线宽区分，不靠彩色图例 */
export const SPORT_COLORS = {
  running: '#111114',
  cycling: '#707072',
} as const

export const DARK_SPORT_COLORS = {
  running: '#f2f2f4',
  cycling: '#969698',
} as const

export const TRAINING_COLORS = {
  heart: '#545456',
  routeMono: '#111114',
  success: '#a3e635', // 唯一讯号色，只表状态
} as const

export const DARK_TRAINING_COLORS = {
  heart: '#b1b1b3',
  routeMono: '#f2f2f4',
  success: '#a3e635',
} as const

/** Pace relative-to-average scale：越快越深，纯明度梯度 */
export const PACE_COLORS = {
  veryFast: '#111114',
  fast: '#3f3f43',
  average: '#707072',
  slow: '#9b9b9e',
  verySlow: '#c2c2c5',
} as const

export const DARK_PACE_COLORS = {
  veryFast: '#f2f2f4',
  fast: '#c8c8cb',
  average: '#969698',
  slow: '#6d6d71',
  verySlow: '#45454a',
} as const

export const PACE_COLOR_VARS = {
  veryFast: 'var(--rpf-pace-very-fast)',
  fast: 'var(--rpf-pace-fast)',
  average: 'var(--rpf-pace-average)',
  slow: 'var(--rpf-pace-slow)',
  verySlow: 'var(--rpf-pace-very-slow)',
} as const

/** Z1 rest → Z5 anaerobic：同一种墨，由浅到深 */
export const HEART_RATE_ZONE_COLORS = [
  '#c2c2c5',
  '#a0a0a3',
  '#7d7d80',
  '#545456',
  '#111114',
] as const

export const HEART_RATE_ZONE_COLOR_VARS = [
  'var(--rpf-heart-zone-1)',
  'var(--rpf-heart-zone-2)',
  'var(--rpf-heart-zone-3)',
  'var(--rpf-heart-zone-4)',
  'var(--rpf-heart-zone-5)',
] as const

/**
 * 品牌色不再有颜色。
 * pr-ui：主按钮是深色实心、CTA 与焦点是深墨描边，彩色只留给状态。
 */
export const BRAND_ACCENT = {
  light: '#111114',
  dark: '#f2f2f4',
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
