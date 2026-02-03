/**
 * Backfill race names for existing half marathon+ activities
 *
 * This script matches existing activities (≥20.5km) with race events
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
  console.log('🏃 Starting race name backfill...\n')

  try {
    // Initialize race matcher browser
    await initRaceMatcher()

    // Get all activities with distance >= 20.5km (half marathon+)
    const halfMarathonActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.raceName, null))
      .all()

    const eligibleActivities = halfMarathonActivities.filter((a) => a.distance >= 20500)

    console.log(
      `📊 Found ${eligibleActivities.length} half marathon+ activities without race names\n`,
    )

    let matchedCount = 0
    let processedCount = 0

    for (const activity of eligibleActivities) {
      processedCount++
      console.log(
        `[${processedCount}/${eligibleActivities.length}] Processing: ${activity.title} (${(activity.distance / 1000).toFixed(2)}km)`,
      )

      // Extract coordinates from GPX
      const coords = extractCoordinatesFromGPX(activity.gpxData)

      // Match race
      const raceName = await matchRaceForActivity(activity.startTime, activity.distance, coords)

      if (raceName) {
        // Update activity with race name
        await db.update(activities).set({ raceName }).where(eq(activities.id, activity.id))

        console.log(`  ✅ Matched: ${raceName}\n`)
        matchedCount++
      } else {
        console.log(`  ⏭️  No race match found\n`)
      }
    }

    console.log('\n==================================================')
    console.log('✨ Backfill completed!')
    console.log(`📈 Processed: ${processedCount} activities`)
    console.log(`🏅 Matched: ${matchedCount} races`)
    console.log('==================================================\n')
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
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
