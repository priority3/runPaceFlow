/**
 * Activities tRPC Router
 *
 * Handles all activity-related API endpoints
 */

import type { SQL } from 'drizzle-orm'
import { and, count, desc, eq, isNotNull, lt, or } from 'drizzle-orm'
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
  weatherData: activities.weatherData,
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

type StatsActivity = {
  type: string
  distance: number
  duration: number
  elevationGain: number | null
  startTime: Date
  averagePace: number | null
}

function summarizePeriodActivities(periodActivities: StatsActivity[]) {
  return {
    activities: periodActivities.length,
    distance: periodActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0),
    duration: periodActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0),
  }
}

function summarizeActivityStats(
  sourceActivities: StatsActivity[],
  ranges: Pick<
    ReturnType<typeof getDateRanges>,
    'oneWeekAgo' | 'twoWeeksAgo' | 'oneMonthAgo' | 'twoMonthsAgo'
  >,
) {
  const totalDistance = sourceActivities.reduce(
    (sum, activity) => sum + (activity.distance || 0),
    0,
  )
  const totalDuration = sourceActivities.reduce(
    (sum, activity) => sum + (activity.duration || 0),
    0,
  )
  const totalElevation = sourceActivities.reduce(
    (sum, activity) => sum + (activity.elevationGain || 0),
    0,
  )

  const activitiesWithPace = sourceActivities.filter((a) => a.averagePace && a.averagePace > 0)
  const averagePace =
    activitiesWithPace.length > 0
      ? activitiesWithPace.reduce((sum, a) => sum + (a.averagePace || 0), 0) /
        activitiesWithPace.length
      : 0

  const thisWeekActivities = sourceActivities.filter(
    (activity) => new Date(activity.startTime) > ranges.oneWeekAgo,
  )
  const lastWeekActivities = sourceActivities.filter((activity) => {
    const activityDate = new Date(activity.startTime)
    return activityDate > ranges.twoWeeksAgo && activityDate <= ranges.oneWeekAgo
  })
  const thisMonthActivities = sourceActivities.filter(
    (activity) => new Date(activity.startTime) > ranges.oneMonthAgo,
  )
  const lastMonthActivities = sourceActivities.filter((activity) => {
    const activityDate = new Date(activity.startTime)
    return activityDate > ranges.twoMonthsAgo && activityDate <= ranges.oneMonthAgo
  })

  return {
    total: {
      activities: sourceActivities.length,
      distance: totalDistance,
      duration: totalDuration,
      elevation: totalElevation,
      averagePace,
    },
    thisWeek: summarizePeriodActivities(thisWeekActivities),
    lastWeek: summarizePeriodActivities(lastWeekActivities),
    thisMonth: summarizePeriodActivities(thisMonthActivities),
    lastMonth: summarizePeriodActivities(lastMonthActivities),
    weeklyTrend: calculateDailyTrend(sourceActivities, 7),
  }
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
    .query(async ({ ctx, input }) => {
      const { limit = 20, type, source } = input || {}
      const offset = input && typeof input.cursor === 'number' ? input.cursor : (input?.offset ?? 0)

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
    .query(async ({ ctx, input }) => {
      const { limit, cursor, type, source } = input

      const filterConditions: SQL[] = []
      if (type) {
        filterConditions.push(eq(activities.type, type))
      }
      if (source) {
        filterConditions.push(eq(activities.source, source))
      }

      const filtersWhere = filterConditions.length > 0 ? and(...filterConditions) : undefined

      const cursorCondition = cursor
        ? or(
            lt(activities.startTime, cursor.startTime),
            and(eq(activities.startTime, cursor.startTime), lt(activities.id, cursor.id)),
          )
        : undefined

      const pageConditions = cursorCondition
        ? [...filterConditions, cursorCondition]
        : filterConditions

      const pageWhere = pageConditions.length > 0 ? and(...pageConditions) : undefined

      let query = ctx.db
        .select(activityColumnsWithoutGpx)
        .from(activities)
        .orderBy(desc(activities.startTime), desc(activities.id))
        .limit(limit + 1)

      if (pageWhere) {
        query = query.where(pageWhere) as any
      }

      const result = await query

      const activitiesPage = result.slice(0, limit)

      const last = activitiesPage.at(-1)
      const nextCursor =
        result.length > limit && last ? { startTime: last.startTime, id: last.id } : null

      let totalQuery = ctx.db.select({ value: count() }).from(activities)
      if (filtersWhere) {
        totalQuery = totalQuery.where(filtersWhere) as any
      }

      const totalResult = await totalQuery
      const total = totalResult[0]?.value ?? 0

      return {
        activities: activitiesPage,
        nextCursor,
        total,
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
        type: activities.type,
        distance: activities.distance,
        duration: activities.duration,
        elevationGain: activities.elevationGain,
        startTime: activities.startTime,
        averagePace: activities.averagePace,
      })
      .from(activities)

    const ranges = getDateRanges()
    const runningActivities = allActivities.filter((activity) => activity.type === 'running')
    const cyclingActivities = allActivities.filter((activity) => activity.type === 'cycling')
    const allStats = summarizeActivityStats(allActivities, ranges)

    return {
      ...allStats,
      byType: {
        running: summarizeActivityStats(runningActivities, ranges),
        cycling: summarizeActivityStats(cyclingActivities, ranges),
      },
    }
  }),

  /**
   * Get parsed coordinates for map display on homepage
   * Reason: Reads pre-computed routeCoordinates (~10KB/row) instead of
   * raw gpxData (~550KB/row), eliminating server-side regex parsing.
   */
  getMapRoutes: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      const routeColumns = {
        id: activities.id,
        type: activities.type,
        startTime: activities.startTime,
        routeCoordinates: activities.routeCoordinates,
        averagePace: activities.averagePace,
      }

      const loadRoutesByType = (type: 'running' | 'cycling') =>
        ctx.db
          .select(routeColumns)
          .from(activities)
          .where(
            and(
              eq(activities.isIndoor, false),
              eq(activities.type, type),
              isNotNull(activities.routeCoordinates),
            ),
          )
          .orderBy(desc(activities.startTime))
          .limit(limit)

      const [runningRoutes, cyclingRoutes] = await Promise.all([
        loadRoutesByType('running'),
        loadRoutesByType('cycling'),
      ])

      const runningQuota = Math.ceil(limit / 2)
      const cyclingQuota = Math.floor(limit / 2)
      const selectedRoutes = [
        ...runningRoutes.slice(0, runningQuota),
        ...cyclingRoutes.slice(0, cyclingQuota),
      ]
      const selectedIds = new Set(selectedRoutes.map((route) => route.id))
      const remainingRoutes = [...runningRoutes, ...cyclingRoutes].sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime(),
      )

      for (const route of remainingRoutes) {
        if (selectedRoutes.length >= limit) break
        if (selectedIds.has(route.id)) continue
        selectedRoutes.push(route)
        selectedIds.add(route.id)
      }

      return selectedRoutes
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .flatMap((activity) => {
          try {
            const raw = JSON.parse(activity.routeCoordinates!) as [number, number][]
            const coordinates = raw.map(([lat, lng]) => ({ lat, lng }))
            if (coordinates.length === 0) return []

            return [
              {
                id: activity.id,
                type: activity.type,
                coordinates,
                averagePace: activity.averagePace,
              },
            ]
          } catch {
            return []
          }
        })
    }),
})
