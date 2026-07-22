/**
 * Smart Activity Naming Module
 *
 * Provides intelligent naming for running activities based on:
 * 1. Stored race event name from the activity database
 * 2. Distance classification (5K, 10K, Half Marathon, Full Marathon, etc.)
 */

import type { Activity } from '@/types/activity'

/**
 * Distance category definitions with tolerance ranges
 * All distances in meters
 */
interface DistanceCategory {
  name: string
  nameEn: string
  minDistance: number
  maxDistance: number
  standardDistance: number
}

// Reason: Only these 5 standard race distances get special names.
// Tolerance: ±200m for short races (3K/5K/10K).
// For marathons, tolerance is asymmetric: slightly below standard to ~500m above
// because GPS drift commonly adds extra distance on longer races.
const DISTANCE_CATEGORIES: DistanceCategory[] = [
  {
    name: '🏅 3K',
    nameEn: '3K',
    minDistance: 2800,
    maxDistance: 3200,
    standardDistance: 3000,
  },
  {
    name: '🏅 5K',
    nameEn: '5K',
    minDistance: 4800,
    maxDistance: 5200,
    standardDistance: 5000,
  },
  {
    name: '🏅 10K',
    nameEn: '10K',
    minDistance: 9800,
    maxDistance: 10200,
    standardDistance: 10000,
  },
  {
    name: '🏅 半程马拉松',
    nameEn: 'Half Marathon',
    minDistance: 20800,
    maxDistance: 21800,
    standardDistance: 21097.5,
  },
  {
    name: '🏅 全程马拉松',
    nameEn: 'Full Marathon',
    minDistance: 41900,
    maxDistance: 42900,
    standardDistance: 42195,
  },
]

/**
 * Get distance category for a given distance in meters
 *
 * @param distanceMeters - Activity distance in meters
 * @returns Category name or null if no standard category matches
 */
export function getDistanceCategory(distanceMeters: number): string | null {
  for (const category of DISTANCE_CATEGORIES) {
    if (distanceMeters >= category.minDistance && distanceMeters < category.maxDistance) {
      return category.name
    }
  }
  return null
}

/**
 * Format distance as a readable string
 * For non-standard distances, returns "X.X 公里跑"
 *
 * @param distanceMeters - Activity distance in meters
 * @returns Formatted distance string
 */
export function formatDistanceLabel(distanceMeters: number): string {
  const km = distanceMeters / 1000
  if (km < 1) {
    return `${Math.round(distanceMeters)} 米跑`
  }
  return `${km.toFixed(1)} 公里跑`
}

/**
 * Generate a smart name for an activity
 *
 * Priority order:
 * 1. Stored race event name from database (e.g., "2024 北京马拉松")
 * 2. Distance category name for 3K/5K/10K/半马/全马 only
 * 3. Original platform name as fallback (e.g., "Evening Run")
 *
 * @param activity - Activity data with distance, startTime, and optional raceName
 * @param originalName - Original activity name from source platform
 * @returns Smart activity name
 */
export function generateSmartName(
  activity: Pick<Activity, 'distance' | 'startTime' | 'gpxData'> & { raceName?: string | null },
  originalName: string,
): string {
  const { distance, raceName } = activity

  // Step 1: Use stored race name if available
  if (raceName) {
    return raceName
  }

  // Step 2: Try distance category (only 3K/5K/10K/半马/全马)
  const category = getDistanceCategory(distance)
  if (category) {
    return category
  }

  // Step 3: Keep original name for all other distances
  // Reason: Preserve platform names like "Evening Run", "Morning Run", etc.
  return originalName
}

/**
 * Check if an activity name should be replaced with a smart name
 * Some names from platforms are meaningful and should be kept
 *
 * @param name - Activity name to check
 * @returns true if the name is generic and should be replaced
 */
export function shouldReplaceActivityName(name: string): boolean {
  const genericPatterns = [
    /^(morning|afternoon|evening|night|lunch)\s+run$/i,
    /^跑步$/,
    /^晨跑$/,
    /^夜跑$/,
    /^run$/i,
    /^running$/i,
  ]

  return genericPatterns.some((pattern) => pattern.test(name.trim()))
}
