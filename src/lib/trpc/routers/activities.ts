/**
 * Activities tRPC Router
 *
 * The main site keeps this public contract stable while Admin owns the
 * underlying shared.db connection and query implementation.
 */

import { z } from 'zod'

import { queryAdmin } from '@/lib/admin-api'
import type { Activity, ActivityListItem, Split } from '@/types/activity'

import { createTRPCRouter, publicProcedure } from '../server'

type ListInput = {
  limit?: number
  offset?: number
  cursor?: number
  type?: 'running' | 'cycling' | 'walking'
  source?: 'nike' | 'strava' | 'garmin'
}

type ListInfiniteInput = {
  limit: number
  cursor?: { startTime: Date; id: string } | null
  type?: 'running' | 'cycling' | 'walking'
  source?: 'nike' | 'strava' | 'garmin'
}

type ActivityStats = {
  activities: number
  distance: number
  duration: number
}

type ActivityStatsGroup = ActivityStats & {
  elevation: number
  averagePace: number
}

type ActivityStatsSummary = {
  total: ActivityStatsGroup
  thisWeek: ActivityStats
  lastWeek: ActivityStats
  thisMonth: ActivityStats
  lastMonth: ActivityStats
  weeklyTrend: number[]
}

type ActivityStatsResponse = ActivityStatsSummary & {
  byType: { running: ActivityStatsSummary; cycling: ActivityStatsSummary }
}

type MapRoute = {
  id: string
  type: string
  coordinates: Array<{ lat: number; lng: number }>
  averagePace: number | null
}

export const activitiesRouter = createTRPCRouter({
  /**
   * Get list of activities with optional filtering
   */
  list: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional().default(20),
          offset: z.number().min(0).optional().default(0),
          cursor: z.number().min(0).optional(),
          type: z.enum(['running', 'cycling', 'walking']).optional(),
          source: z.enum(['nike', 'strava', 'garmin']).optional(),
        })
        .optional(),
    )
    .query(({ input }) =>
      queryAdmin<{
        activities: ActivityListItem[]
        pagination: { total: number; limit: number; offset: number; hasMore: boolean }
      }>('activities.list', (input ?? {}) as ListInput),
    ),

  /**
   * Infinite list of activities (cursor-based pagination)
   *
   * Reason: Home page needs to load more than 20 rows without rendering
   * thousands of DOM nodes. Cursor pagination is stable and works well with
   * react-query's useInfiniteQuery.
   */
  listInfinite: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z
          .object({
            startTime: z.date(),
            id: z.string(),
          })
          .nullish(),
        type: z.enum(['running', 'cycling', 'walking']).optional(),
        source: z.enum(['nike', 'strava', 'garmin']).optional(),
      }),
    )
    .query(({ input }) =>
      queryAdmin<{
        activities: ActivityListItem[]
        nextCursor: { startTime: Date; id: string } | null
        total: number
      }>('activities.listInfinite', input as ListInfiniteInput),
    ),

  /**
   * Get activity by ID with full details
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => queryAdmin<Activity>('activities.getById', input)),

  /**
   * Get splits for an activity
   */
  getSplits: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(({ input }) => queryAdmin<Split[]>('activities.getSplits', input)),

  /**
   * Get activity with splits (combined query)
   */
  getWithSplits: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) =>
      queryAdmin<{ activity: ActivityListItem; splits: Split[] }>(
        'activities.getWithSplits',
        input,
      ),
    ),

  /**
   * Get GPX data for an activity (lazy-loaded, can be several MB)
   */
  getGpxData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => queryAdmin<string | null>('activities.getGpxData', input)),

  /**
   * Get activity statistics with trend comparison
   */
  getStats: publicProcedure.query(() =>
    queryAdmin<ActivityStatsResponse>('activities.getStats', {}),
  ),

  /**
   * Get parsed coordinates for map display on homepage
   * Reason: Reads pre-computed routeCoordinates (~10KB/row) instead of
   * raw gpxData (~550KB/row), eliminating server-side regex parsing.
   */
  getMapRoutes: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(20) }).optional())
    .query(({ input }) => queryAdmin<MapRoute[]>('activities.getMapRoutes', input ?? {})),
})
