/**
 * Custom hooks for activities data fetching
 *
 * Wraps tRPC queries with React Query for activities
 */

'use client'

import { trpc } from '@/lib/trpc/client'

/**
 * Fetch activities list
 */
export function useActivities(options?: {
  limit?: number
  offset?: number
  type?: 'running' | 'cycling' | 'walking'
  source?: 'nike' | 'strava' | 'garmin'
}) {
  return trpc.activities.list.useQuery(options)
}

/**
 * Fetch activity statistics
 */
export function useActivityStats() {
  return trpc.activities.getStats.useQuery()
}

/**
 * Fetch single activity by ID
 */
export function useActivity(id: string) {
  return trpc.activities.getById.useQuery({ id })
}

/**
 * Fetch activity with splits
 */
export function useActivityWithSplits(id: string) {
  return trpc.activities.getWithSplits.useQuery({ id })
}
