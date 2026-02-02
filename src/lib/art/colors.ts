/**
 * Art Color Utilities
 *
 * Color mapping functions for algorithmic art generation
 * Uses Apple UIKit color system for consistency
 */

/**
 * Heart rate zone colors (blue → green → yellow → orange → red)
 */
export const heartRateZoneColors = {
  zone1: '#007AFF', // Blue - Recovery (50-60% max HR)
  zone2: '#34C759', // Green - Aerobic (60-70% max HR)
  zone3: '#FFCC00', // Yellow - Tempo (70-80% max HR)
  zone4: '#FF9500', // Orange - Threshold (80-90% max HR)
  zone5: '#FF3B30', // Red - Anaerobic (90-100% max HR)
} as const

/**
 * Pace zone colors (fast to slow)
 */
export const paceZoneColors = {
  veryFast: '#34C759', // Green - Much faster than average
  fast: '#30D158', // Light green - Faster than average
  average: '#FFCC00', // Yellow - Near average
  slow: '#FF9500', // Orange - Slower than average
  verySlow: '#FF3B30', // Red - Much slower than average
} as const

/**
 * Elevation gradient colors
 */
export const elevationColors = {
  low: '#5856D6', // Indigo - Low elevation
  medium: '#AF52DE', // Purple - Medium elevation
  high: '#FF2D55', // Pink - High elevation
} as const

/**
 * Get heart rate zone (1-5) based on percentage of max HR
 * @param heartRate Current heart rate
 * @param maxHeartRate Maximum heart rate
 * @returns Zone number 1-5
 */
export function getHeartRateZone(heartRate: number, maxHeartRate: number): number {
  const percentage = (heartRate / maxHeartRate) * 100

  if (percentage < 60) return 1
  if (percentage < 70) return 2
  if (percentage < 80) return 3
  if (percentage < 90) return 4
  return 5
}

/**
 * Get color for heart rate zone
 * @param zone Zone number 1-5
 * @returns Hex color string
 */
export function getHeartRateZoneColor(zone: number): string {
  const colors = [
    heartRateZoneColors.zone1,
    heartRateZoneColors.zone2,
    heartRateZoneColors.zone3,
    heartRateZoneColors.zone4,
    heartRateZoneColors.zone5,
  ]
  return colors[Math.min(Math.max(zone - 1, 0), 4)]
}

/**
 * Get color for heart rate value
 * @param heartRate Current heart rate
 * @param maxHeartRate Maximum heart rate (default 190)
 * @returns Hex color string
 */
export function getHeartRateColor(heartRate: number, maxHeartRate = 190): string {
  const zone = getHeartRateZone(heartRate, maxHeartRate)
  return getHeartRateZoneColor(zone)
}

/**
 * Get color for pace relative to average
 * @param pace Current pace in seconds/km
 * @param averagePace Average pace in seconds/km
 * @returns Hex color string
 */
export function getPaceZoneColor(pace: number, averagePace: number): string {
  const diff = pace - averagePace

  if (diff < -30) return paceZoneColors.veryFast
  if (diff < 0) return paceZoneColors.fast
  if (diff < 10) return paceZoneColors.average
  if (diff < 30) return paceZoneColors.slow
  return paceZoneColors.verySlow
}

/**
 * Get color for elevation
 * @param elevation Current elevation in meters
 * @param minElevation Minimum elevation in the route
 * @param maxElevation Maximum elevation in the route
 * @returns Hex color string
 */
export function getElevationColor(
  elevation: number,
  minElevation: number,
  maxElevation: number,
): string {
  const range = maxElevation - minElevation
  if (range === 0) return elevationColors.medium

  const normalized = (elevation - minElevation) / range

  if (normalized < 0.33) return elevationColors.low
  if (normalized < 0.66) return elevationColors.medium
  return elevationColors.high
}

/**
 * Interpolate between two colors
 * @param color1 Start color (hex)
 * @param color2 End color (hex)
 * @param factor Interpolation factor (0-1)
 * @returns Interpolated hex color
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')

  const r1 = Number.parseInt(hex1.slice(0, 2), 16)
  const g1 = Number.parseInt(hex1.slice(2, 4), 16)
  const b1 = Number.parseInt(hex1.slice(4, 6), 16)

  const r2 = Number.parseInt(hex2.slice(0, 2), 16)
  const g2 = Number.parseInt(hex2.slice(2, 4), 16)
  const b2 = Number.parseInt(hex2.slice(4, 6), 16)

  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Convert hex color to RGBA
 * @param hex Hex color string
 * @param alpha Alpha value (0-1)
 * @returns RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Generate a gradient array of colors for smooth transitions
 * @param colors Array of hex colors
 * @param steps Number of steps in the gradient
 * @returns Array of interpolated colors
 */
export function generateGradient(colors: string[], steps: number): string[] {
  if (colors.length < 2) return colors
  if (steps <= colors.length) return colors

  const result: string[] = []
  const segmentSteps = Math.floor(steps / (colors.length - 1))

  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = 0; j < segmentSteps; j++) {
      const factor = j / segmentSteps
      result.push(interpolateColor(colors[i], colors[i + 1], factor))
    }
  }

  // Add the last color
  const lastColor = colors.at(-1)
  if (lastColor) {
    result.push(lastColor)
  }

  return result
}

/**
 * Art theme presets
 */
export const artThemes = {
  default: {
    background: '#000000',
    foreground: '#FFFFFF',
    accent: '#007AFF',
  },
  warm: {
    background: '#1A1A2E',
    foreground: '#EAEAEA',
    accent: '#FF6B6B',
  },
  cool: {
    background: '#0F0F23',
    foreground: '#CCCCFF',
    accent: '#00D4FF',
  },
  nature: {
    background: '#0D1B0D',
    foreground: '#E8F5E9',
    accent: '#4CAF50',
  },
} as const

export type ArtTheme = keyof typeof artThemes

/**
 * Premium color palettes for fingerprint visualization
 * Vibrant but harmonious gradients for data art
 */
export const premiumPalettes = {
  default: {
    // Vibrant cyan to warm coral - Strava-inspired
    colors: ['#00D4AA', '#00C9B7', '#FFD93D', '#FF8C42', '#FF6B6B'],
    name: 'Strava',
  },
  warm: {
    // Energetic warm gradient - sunrise vibes
    colors: ['#FFE66D', '#FFB347', '#FF7F50', '#FF6B6B', '#EE5A5A'],
    name: 'Sunrise',
  },
  cool: {
    // Electric blue to purple - Nike Run Club style
    colors: ['#00F5FF', '#00D4FF', '#7B68EE', '#9370DB', '#BA55D3'],
    name: 'Electric',
  },
  nature: {
    // Vivid forest gradient - natural energy
    colors: ['#00FF88', '#00E676', '#00C853', '#00A844', '#008B3A'],
    name: 'Forest',
  },
} as const

export type PremiumPalette = keyof typeof premiumPalettes

/**
 * Get smooth pace color using multi-point interpolation
 * Creates seamless gradient transitions instead of hard zone boundaries
 *
 * @param pace Current pace in seconds/km
 * @param minPace Fastest pace in the run
 * @param maxPace Slowest pace in the run
 * @param palette Color palette to use
 * @returns Interpolated hex color
 */
export function getSmoothPaceColor(
  pace: number,
  minPace: number,
  maxPace: number,
  palette: PremiumPalette = 'default',
): string {
  const { colors } = premiumPalettes[palette]
  const range = maxPace - minPace

  // Handle edge case where all paces are the same
  if (range === 0) {
    return colors[Math.floor(colors.length / 2)]
  }

  // Normalize pace to 0-1 range (0 = fastest, 1 = slowest)
  const normalized = Math.max(0, Math.min(1, (pace - minPace) / range))

  // Calculate which segment of the gradient we're in
  const segmentCount = colors.length - 1
  const segmentIndex = Math.min(Math.floor(normalized * segmentCount), segmentCount - 1)
  const segmentProgress = normalized * segmentCount - segmentIndex

  // Interpolate between the two colors in this segment
  return interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], segmentProgress)
}

/**
 * Get smooth heart rate color using multi-point interpolation
 *
 * @param heartRate Current heart rate
 * @param maxHeartRate Maximum heart rate
 * @param palette Color palette to use
 * @returns Interpolated hex color
 */
export function getSmoothHeartRateColor(
  heartRate: number,
  maxHeartRate: number,
  palette: PremiumPalette = 'default',
): string {
  const { colors } = premiumPalettes[palette]

  // Normalize heart rate to 0-1 range (50-100% of max HR)
  const percentage = heartRate / maxHeartRate
  const normalized = Math.max(0, Math.min(1, (percentage - 0.5) / 0.5))

  // Calculate which segment of the gradient we're in
  const segmentCount = colors.length - 1
  const segmentIndex = Math.min(Math.floor(normalized * segmentCount), segmentCount - 1)
  const segmentProgress = normalized * segmentCount - segmentIndex

  return interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], segmentProgress)
}

/**
 * Get smooth elevation color using multi-point interpolation
 *
 * @param elevation Current elevation
 * @param minElevation Minimum elevation in route
 * @param maxElevation Maximum elevation in route
 * @param palette Color palette to use
 * @returns Interpolated hex color
 */
export function getSmoothElevationColor(
  elevation: number,
  minElevation: number,
  maxElevation: number,
  palette: PremiumPalette = 'default',
): string {
  const { colors } = premiumPalettes[palette]
  const range = maxElevation - minElevation

  if (range === 0) {
    return colors[Math.floor(colors.length / 2)]
  }

  const normalized = Math.max(0, Math.min(1, (elevation - minElevation) / range))

  const segmentCount = colors.length - 1
  const segmentIndex = Math.min(Math.floor(normalized * segmentCount), segmentCount - 1)
  const segmentProgress = normalized * segmentCount - segmentIndex

  return interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], segmentProgress)
}

/**
 * Darken a hex color by a percentage
 * @param hex Hex color string
 * @param percent Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darkenColor(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '')
  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  const factor = 1 - percent / 100
  const newR = Math.round(r * factor)
  const newG = Math.round(g * factor)
  const newB = Math.round(b * factor)

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

/**
 * Lighten a hex color by a percentage
 * @param hex Hex color string
 * @param percent Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export function lightenColor(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '')
  const r = Number.parseInt(cleanHex.slice(0, 2), 16)
  const g = Number.parseInt(cleanHex.slice(2, 4), 16)
  const b = Number.parseInt(cleanHex.slice(4, 6), 16)

  const factor = percent / 100
  const newR = Math.round(r + (255 - r) * factor)
  const newG = Math.round(g + (255 - g) * factor)
  const newB = Math.round(b + (255 - b) * factor)

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
