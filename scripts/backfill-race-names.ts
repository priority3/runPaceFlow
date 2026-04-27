/**
 * Backfill race names for existing race activities
 *
 * This script matches existing running activities (≥5km) with race events
 * and updates their race_name field in the database.
 */

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { activities } from '@/lib/db/schema'
import {
  cleanupRaceMatcher,
  extractCoordinatesFromGPX,
  initRaceMatcher,
  matchRaceForActivity,
} from '@/lib/sync/race-matcher'

async function backfillRaceNames() {
  console.info('🏃 Starting race name backfill...\n')

  try {
    // Initialize race matcher browser
    await initRaceMatcher()

    // Get all running activities with distance >= 5km (common race distances)
    const allActivities = await db.select().from(activities).all()

    // Filter for race-distance activities without race names (5km, 10km, half, full marathon)
    const eligibleActivities = allActivities.filter(
      (a) =>
        a.type === 'running' && a.distance >= 5000 && (a.raceName === null || a.raceName === ''),
    )

    console.info(
      `📊 Found ${eligibleActivities.length} race-distance activities (≥5km) without race names\n`,
    )

    let matchedCount = 0
    let processedCount = 0

    for (const activity of eligibleActivities) {
      processedCount++
      console.info(
        `[${processedCount}/${eligibleActivities.length}] Processing: ${activity.title} (${(activity.distance / 1000).toFixed(2)}km)`,
      )

      // Extract coordinates from GPX
      const coords = extractCoordinatesFromGPX(activity.gpxData)

      // Match race
      const raceName = await matchRaceForActivity(activity.startTime, activity.distance, coords)

      if (raceName) {
        // Update activity with race name
        await db.update(activities).set({ raceName }).where(eq(activities.id, activity.id))

        console.info(`  ✅ Matched: ${raceName}\n`)
        matchedCount++
      } else {
        console.info(`  ⏭️  No race match found\n`)
      }
    }

    console.info('\n==================================================')
    console.info('✨ Backfill completed!')
    console.info(`📈 Processed: ${processedCount} activities`)
    console.info(`🏅 Matched: ${matchedCount} races`)
    console.info('==================================================\n')
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    throw error
  } finally {
    // Cleanup race matcher resources
    await cleanupRaceMatcher()
  }
}

// Run the backfill
backfillRaceNames()
  .then(() => {
    console.info('✅ Script completed successfully')
    process.exitCode = 0
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exitCode = 1
  })
