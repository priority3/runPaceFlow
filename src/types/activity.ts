/**
 * Database types
 *
 * Type definitions for database models
 */

import type { activities, splits } from '@/lib/db/schema'

// Infer types from Drizzle schema
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert

// Reason: List/stats queries exclude gpxData and routeCoordinates (heavy blob columns)
// for performance. Components that don't need them should accept this lighter type.
export type ActivityListItem = Omit<Activity, 'gpxData' | 'routeCoordinates'>

export type Split = typeof splits.$inferSelect
export type NewSplit = typeof splits.$inferInsert

// API response types
export interface ActivityWithSplits {
  activity: Activity
  splits: Split[]
}

export interface ActivityStats {
  totalRuns: number
  totalDistance: number
  totalDuration: number
  averagePace: number
}
