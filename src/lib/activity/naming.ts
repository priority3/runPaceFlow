/**
 * Smart Activity Naming Module
 *
 * Provides intelligent naming for running activities based on:
 * 1. Stored race event name (matched during sync)
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

const DISTANCE_CATEGORIES: DistanceCategory[] = [
  {
    name: '🏅 5K',
    nameEn: '5K',
    minDistance: 4500,
    maxDistance: 5500,
    standardDistance: 5000,
  },
  {
    name: '🏅 10K',
    nameEn: '10K',
    minDistance: 9500,
    maxDistance: 10500,
    standardDistance: 10000,
  },
  {
    name: '🏅 半程马拉松',
    nameEn: 'Half Marathon',
    minDistance: 20500,
    maxDistance: 21500,
    standardDistance: 21097.5,
  },
  {
    name: '🏅 全程马拉松',
    nameEn: 'Full Marathon',
    minDistance: 41500,
    maxDistance: 42500,
    standardDistance: 42195,
  },
  {
    name: '🏅 超级马拉松',
    nameEn: 'Ultra Marathon',
    minDistance: 42500,
    maxDistance: Infinity,
    standardDistance: 50000,
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
 * 2. Distance category name (e.g., "半程马拉松", "10K")
 * 3. Formatted distance (e.g., "8.5 公里跑")
 * 4. Original name as fallback
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

  // Step 1: Use stored race name if available (matched during sync)
  if (raceName) {
    return raceName
  }

  // Step 2: Try distance category
  const category = getDistanceCategory(distance)
  if (category) {
    return category
  }

  // Step 3: For shorter distances, check if original name is generic
  const genericNames = [
    'Morning Run',
    'Afternoon Run',
    'Evening Run',
    'Night Run',
    'Lunch Run',
    '晨跑',
    '夜跑',
    '跑步',
    'Run',
  ]

  const isGenericName = genericNames.some(
    (name) => originalName.toLowerCase() === name.toLowerCase() || originalName === name,
  )

  if (isGenericName) {
    return formatDistanceLabel(distance)
  }

  // Step 4: Keep original name if it's meaningful
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
