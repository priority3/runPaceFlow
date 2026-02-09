/**
 * Activities tRPC Router
 *
 * Handles all activity-related API endpoints
 */

import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { activities, splits } from '@/lib/db/schema'

import { createTRPCRouter, publicProcedure } from '../server'

/**
 * Reason: gpxData can be 500KB-2MB per activity. Selecting all columns
 * in list/stats queries transfers 10+ MB of unused data to the frontend,
 * causing browser freezes. Only select gpxData when explicitly needed.
 */
const activityColumnsWithoutGpx = {
  id: activities.id,
  title: activities.title,
  type: activities.type,
  source: activities.source,
  sourceId: activities.sourceId,
  startTime: activities.startTime,
  endTime: activities.endTime,
  duration: activities.duration,
  distance: activities.distance,
  averagePace: activities.averagePace,
  bestPace: activities.bestPace,
  elevationGain: activities.elevationGain,
  averageHeartRate: activities.averageHeartRate,
  maxHeartRate: activities.maxHeartRate,
  calories: activities.calories,
  isIndoor: activities.isIndoor,
  raceName: activities.raceName,
  createdAt: activities.createdAt,
  updatedAt: activities.updatedAt,
}

/**
 * Helper to get date range boundaries
 */
function getDateRanges() {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  // This week (last 7 days)
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  oneWeekAgo.setHours(0, 0, 0, 0)

  // Last week (7-14 days ago)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  twoWeeksAgo.setHours(0, 0, 0, 0)

  // This month (last 30 days)
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)
  oneMonthAgo.setHours(0, 0, 0, 0)

  // Last month (30-60 days ago)
  const twoMonthsAgo = new Date(now)
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60)
  twoMonthsAgo.setHours(0, 0, 0, 0)

  return { now, oneWeekAgo, twoWeeksAgo, oneMonthAgo, twoMonthsAgo }
}

/**
 * Calculate daily distance for the last N days
 */
function calculateDailyTrend(
  allActivities: { startTime: Date; distance: number }[],
  days: number,
): number[] {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const dailyData: number[] = []

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const dayDistance = allActivities
      .filter((a) => {
        const activityDate = new Date(a.startTime)
        return activityDate >= dayStart && activityDate <= dayEnd
      })
      .reduce((sum, a) => sum + (a.distance || 0), 0)

    dailyData.push(dayDistance)
  }

  return dailyData
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
          type: z.enum(['running', 'cycling', 'walking']).optional(),
          source: z.enum(['nike', 'strava', 'garmin']).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0, type, source } = input || {}

      let query = ctx.db
        .select(activityColumnsWithoutGpx)
        .from(activities)
        .orderBy(desc(activities.startTime))
        .limit(limit)
        .offset(offset)

      // Apply filters
      const conditions = []
      if (type) {
        conditions.push(eq(activities.type, type))
      }
      if (source) {
        conditions.push(eq(activities.source, source))
      }

      if (conditions.length > 0) {
        query = query.where(conditions[0]) as any
      }

      const result = await query

      const totalResult = await ctx.db.select({ value: count() }).from(activities)
      const total = totalResult[0].value

      return {
        activities: result,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }
    }),

  /**
   * Get activity by ID with full details
   */
  getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const activity = await ctx.db
      .select()
      .from(activities)
      .where(eq(activities.id, input.id))
      .limit(1)

    if (!activity || activity.length === 0) {
      throw new Error('Activity not found')
    }

    return activity[0]
  }),

  /**
   * Get splits for an activity
   */
  getSplits: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .query(async ({ ctx, input }) => {
      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.activityId))
        .orderBy(splits.kilometer)

      return activitySplits
    }),

  /**
   * Get activity with splits (combined query)
   */
  getWithSplits: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db
        .select(activityColumnsWithoutGpx)
        .from(activities)
        .where(eq(activities.id, input.id))
        .limit(1)

      if (!activity || activity.length === 0) {
        throw new Error('Activity not found')
      }

      const activitySplits = await ctx.db
        .select()
        .from(splits)
        .where(eq(splits.activityId, input.id))
        .orderBy(splits.kilometer)

      return {
        activity: activity[0],
        splits: activitySplits,
      }
    }),

  /**
   * Get GPX data for an activity (lazy-loaded, can be several MB)
   */
  getGpxData: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select({ gpxData: activities.gpxData })
      .from(activities)
      .where(eq(activities.id, input.id))
      .limit(1)

    return result[0]?.gpxData ?? null
  }),

  /**
   * Get activity statistics with trend comparison
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    // Reason: Only select fields needed for stats, exclude heavy gpxData
    const allActivities = await ctx.db
      .select({
        distance: activities.distance,
        duration: activities.duration,
        elevationGain: activities.elevationGain,
        startTime: activities.startTime,
        averagePace: activities.averagePace,
      })
      .from(activities)
    const { oneWeekAgo, twoWeeksAgo, oneMonthAgo, twoMonthsAgo } = getDateRanges()

    const totalDistance = allActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
    const totalDuration = allActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0)
    const totalElevation = allActivities.reduce(
      (sum, activity) => sum + (activity.elevationGain || 0),
      0,
    )

    // Calculate average pace from all activities
    const activitiesWithPace = allActivities.filter((a) => a.averagePace && a.averagePace > 0)
    const avgPace =
      activitiesWithPace.length > 0
        ? activitiesWithPace.reduce((sum, a) => sum + (a.averagePace || 0), 0) /
          activitiesWithPace.length
        : 0

    // This week stats (last 7 days)
    const thisWeekActivities = allActivities.filter(
      (activity) => new Date(activity.startTime) > oneWeekAgo,
    )
    const thisWeekDistance = thisWeekActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const thisWeekDuration = thisWeekActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const thisWeekCount = thisWeekActivities.length

    // Last week stats (7-14 days ago)
    const lastWeekActivities = allActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime)
      return activityDate > twoWeeksAgo && activityDate <= oneWeekAgo
    })
    const lastWeekDistance = lastWeekActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const lastWeekDuration = lastWeekActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const lastWeekCount = lastWeekActivities.length

    // This month stats (last 30 days)
    const thisMonthActivities = allActivities.filter(
      (activity) => new Date(activity.startTime) > oneMonthAgo,
    )
    const thisMonthDistance = thisMonthActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const thisMonthDuration = thisMonthActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const thisMonthCount = thisMonthActivities.length

    // Last month stats (30-60 days ago)
    const lastMonthActivities = allActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime)
      return activityDate > twoMonthsAgo && activityDate <= oneMonthAgo
    })
    const lastMonthDistance = lastMonthActivities.reduce(
      (sum, activity) => sum + (activity.distance || 0),
      0,
    )
    const lastMonthDuration = lastMonthActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    )
    const lastMonthCount = lastMonthActivities.length

    // Calculate 7-day trend data for sparklines
    const weeklyTrend = calculateDailyTrend(allActivities, 7)

    return {
      total: {
        activities: allActivities.length,
        distance: totalDistance,
        duration: totalDuration,
        elevation: totalElevation,
        averagePace: avgPace,
      },
      thisWeek: {
        activities: thisWeekCount,
        distance: thisWeekDistance,
        duration: thisWeekDuration,
      },
      lastWeek: {
        activities: lastWeekCount,
        distance: lastWeekDistance,
        duration: lastWeekDuration,
      },
      thisMonth: {
        activities: thisMonthCount,
        distance: thisMonthDistance,
        duration: thisMonthDuration,
      },
      lastMonth: {
        activities: lastMonthCount,
        distance: lastMonthDistance,
        duration: lastMonthDuration,
      },
      weeklyTrend,
    }
  }),

  /**
   * Get parsed coordinates for map display on homepage
   * Reason: Extracting coordinates server-side avoids sending 11+ MB of raw GPX XML
   * to the frontend. Only lightweight lat/lng arrays are returned (~200KB vs 11MB).
   */
  getMapRoutes: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20

      const result = await ctx.db
        .select({
          id: activities.id,
          gpxData: activities.gpxData,
          averagePace: activities.averagePace,
        })
        .from(activities)
        .where(eq(activities.isIndoor, false))
        .orderBy(desc(activities.startTime))
        .limit(limit)

      // Reason: Parse GPX on server and return only coordinates.
      // A single GPX file can be 500KB-2MB of XML; extracting lat/lng reduces to ~10KB.
      return result
        .filter((a) => a.gpxData != null)
        .map((a) => {
          const coordinates: Array<{ lat: number; lng: number }> = []
          const trkptRegex = /<trkpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["']/gi
          let match
          while ((match = trkptRegex.exec(a.gpxData!)) !== null) {
            const lat = Number.parseFloat(match[1])
            const lng = Number.parseFloat(match[2])
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              coordinates.push({ lat, lng })
            }
          }

          // Downsample to max 500 points per route for rendering performance
          const maxPoints = 500
          const downsampled =
            coordinates.length > maxPoints
              ? coordinates.filter((_, i) => i % Math.ceil(coordinates.length / maxPoints) === 0)
              : coordinates

          return {
            id: a.id,
            coordinates: downsampled,
            averagePace: a.averagePace,
          }
        })
        .filter((a) => a.coordinates.length > 0)
    }),
})
