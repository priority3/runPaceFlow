#!/usr/bin/env bun

/**
 * Automatic Activity Sync Script
 *
 * Syncs running activities from Strava or Nike Run Club
 * Designed to run via GitHub Actions or locally
 *
 * Features:
 * - Incremental sync: Only fetches activities after the last synced timestamp
 * - Priority: Strava > Nike
 */

import { desc } from 'drizzle-orm'

import { db } from '../src/lib/db'
import { runMigrations } from '../src/lib/db/migrate'
import { activities } from '../src/lib/db/schema'
import { NikeAdapter } from '../src/lib/sync/adapters/nike'
import { StravaAdapter } from '../src/lib/sync/adapters/strava'
import { backfillMissingWeather, syncActivities } from '../src/lib/sync/processor'
import { cleanupRaceMatcher, initRaceMatcher } from '../src/lib/sync/race-matcher'

// Load environment variables
const {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFRESH_TOKEN,
  NIKE_REFRESH_TOKEN,
  NIKE_ACCESS_TOKEN,
} = process.env

interface SyncResult {
  source: 'strava' | 'nike'
  count: number
  activityIds: string[]
}

/**
 * Get the latest activity timestamp from the database
 * Used for incremental sync to only fetch new activities
 */
async function getLatestActivityTimestamp(): Promise<number | null> {
  const result = await db
    .select({ startTime: activities.startTime })
    .from(activities)
    .orderBy(desc(activities.startTime))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  // Convert Date to Unix timestamp (seconds)
  return Math.floor(result[0].startTime.getTime() / 1000)
}

/**
 * Sync activities from Strava
 */
async function syncStrava(): Promise<SyncResult> {
  console.info('🏃 Syncing from Strava...')

  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
    throw new Error('Strava credentials not configured')
  }

  const adapter = new StravaAdapter(STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN)

  // Authenticate
  const authenticated = await adapter.authenticate({})
  if (!authenticated) {
    throw new Error('Strava authentication failed')
  }

  // Get the latest activity timestamp for incremental sync
  const lastTimestamp = await getLatestActivityTimestamp()

  if (lastTimestamp) {
    const lastDate = new Date(lastTimestamp * 1000)
    console.info(`📅 Incremental sync: fetching activities after ${lastDate.toISOString()}`)
  } else {
    console.info('📅 Full sync: no existing activities found')
  }

  // Get activities (incremental if we have a timestamp)
  const rawActivities = await adapter.getActivities({
    limit: 50,
    after: lastTimestamp ?? undefined,
  })
  console.info(`📥 Fetched ${rawActivities.length} activities from Strava`)

  // Sync to database
  const syncedIds = await syncActivities(rawActivities)
  console.info(`✅ Synced ${syncedIds.length} new activities`)

  return {
    source: 'strava',
    count: syncedIds.length,
    activityIds: syncedIds,
  }
}

/**
 * Sync activities from Nike
 */
async function syncNike(): Promise<SyncResult> {
  console.info('🏃 Syncing from Nike Run Club...')

  const token = NIKE_REFRESH_TOKEN || NIKE_ACCESS_TOKEN
  if (!token) {
    throw new Error('Nike credentials not configured')
  }

  const adapter = NIKE_REFRESH_TOKEN
    ? new NikeAdapter(NIKE_REFRESH_TOKEN, NIKE_REFRESH_TOKEN)
    : new NikeAdapter(NIKE_ACCESS_TOKEN!)

  // Get the latest activity timestamp for incremental sync
  const lastTimestamp = await getLatestActivityTimestamp()

  if (lastTimestamp) {
    const lastDate = new Date(lastTimestamp * 1000)
    console.info(`📅 Incremental sync: fetching activities after ${lastDate.toISOString()}`)
  } else {
    console.info('📅 Full sync: no existing activities found')
  }

  // Get activities (incremental if we have a timestamp)
  const rawActivities = await adapter.getActivities({
    limit: 50,
    after: lastTimestamp ?? undefined,
  })
  console.info(`📥 Fetched ${rawActivities.length} activities from Nike`)

  // Sync to database
  const syncedIds = await syncActivities(rawActivities)
  console.info(`✅ Synced ${syncedIds.length} new activities`)

  return {
    source: 'nike',
    count: syncedIds.length,
    activityIds: syncedIds,
  }
}

/**
 * Determine which source to sync
 */
function determineSyncSource(): 'strava' | 'nike' | null {
  // Auto-detect (Priority: Strava > Nike)
  if (STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET && STRAVA_REFRESH_TOKEN) {
    return 'strava'
  }

  if (NIKE_REFRESH_TOKEN || NIKE_ACCESS_TOKEN) {
    return 'nike'
  }

  return null
}

/**
 * Main sync function
 */
async function main(): Promise<number> {
  // Reason: Ensure DB schema is up to date before any sync operations
  await runMigrations()

  console.info('🚀 Starting activity sync...')
  console.info(`📅 ${new Date().toISOString()}`)
  console.info('')

  const source = determineSyncSource()
  console.info(`🔧 Sync mode: ${source}`)

  if (!source) {
    console.error('❌ No sync source configured')
    console.error('Please set either:')
    console.error('  - STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN')
    console.error('  - NIKE_REFRESH_TOKEN or NIKE_ACCESS_TOKEN')
    return 1
  }

  // Reason: Race matching relies on Playwright (zuicool.com scraping).
  // If browsers aren't installed (e.g. local dev), we should still sync
  // activities instead of failing the whole job.
  try {
    await initRaceMatcher()
  } catch (error) {
    console.warn(
      '⚠️  Race matcher not available (Playwright browsers missing). ' +
        'Run `bunx playwright install chromium` to enable marathon matching.',
    )
    console.warn(error)
  }

  try {
    let result: SyncResult

    if (source === 'strava') {
      result = await syncStrava()
    } else {
      result = await syncNike()
    }

    console.info('')
    console.info('='.repeat(50))
    console.info('✨ Sync completed successfully!')
    console.info(`📊 Source: ${result.source.toUpperCase()}`)
    console.info(`📈 New activities: ${result.count}`)
    console.info('='.repeat(50))

    // Reason: After syncing new activities, backfill weather for any activities
    // that are still missing weather data (e.g. from earlier failed fetches)
    const weatherResult = await backfillMissingWeather()
    if (weatherResult.total > 0) {
      console.info(`🌤️  Weather backfill: ${weatherResult.success}/${weatherResult.total} updated`)
    }

    return 0
  } catch (error) {
    console.error('')
    console.error('='.repeat(50))
    console.error('❌ Sync failed!')
    console.error('Error:', error instanceof Error ? error.message : String(error))
    console.error('='.repeat(50))
    return 1
  } finally {
    await cleanupRaceMatcher()
  }
}

// Run the script
main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exitCode = 1
  })
