#!/usr/bin/env bun

/**
 * Automatic Activity Sync Script
 *
 * Syncs running activities from Strava or Nike Run Club
 * Designed to run via GitHub Actions or locally
 *
 * Priority: Strava > Nike
 */

import { NikeAdapter } from '../src/lib/sync/adapters/nike'
import { StravaAdapter } from '../src/lib/sync/adapters/strava'
import { syncActivities } from '../src/lib/sync/processor'

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

  // Get activities
  const rawActivities = await adapter.getActivities({ limit: 50 })
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

  // Get activities
  const rawActivities = await adapter.getActivities({ limit: 50 })
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
async function main() {
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
    process.exit(1)
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

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('='.repeat(50))
    console.error('❌ Sync failed!')
    console.error('Error:', error instanceof Error ? error.message : String(error))
    console.error('='.repeat(50))
    process.exit(1)
  }
}

// Run the script
main()
