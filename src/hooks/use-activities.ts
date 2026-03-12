/**
 * Custom hooks for activities data fetching
 *
 * Wraps tRPC queries with React Query for activities
 */

'use client'

import { trpc } from '@/lib/trpc/client'

/**
 * Fetch activities list (excludes gpxData for performance)
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
 * Fetch activities list with infinite pagination
 */
export function useInfiniteActivities(options?: {
  limit?: number
  type?: 'running' | 'cycling' | 'walking'
  source?: 'nike' | 'strava' | 'garmin'
}) {
  return trpc.activities.list.useInfiniteQuery(
    {
      limit: options?.limit,
      type: options?.type,
      source: options?.source,
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore
          ? lastPage.pagination.offset + lastPage.pagination.limit
          : undefined,
    },
  )
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
 * Fetch activity with splits (excludes gpxData)
 */
export function useActivityWithSplits(id: string) {
  return trpc.activities.getWithSplits.useQuery({ id })
}

/**
 * Fetch GPX data for a single activity (lazy-loaded)
 */
export function useGpxData(id: string, enabled = true) {
  return trpc.activities.getGpxData.useQuery({ id }, { enabled })
}

/**
 * Fetch GPX routes for homepage map display
 */
export function useMapRoutes(limit = 20) {
  return trpc.activities.getMapRoutes.useQuery({ limit })
}
