/**
 * Backfill route_coordinates for existing activities
 *
 * Reads gpx_data from the database, extracts downsampled coordinates,
 * and writes them to the route_coordinates column. No external API calls.
 *
 * Usage: bun run scripts/backfill-route-coordinates.ts
 */

import { eq, isNull, and, isNotNull } from 'drizzle-orm'

import { db } from '../src/lib/db/client'
import { activities } from '../src/lib/db/schema'
import { extractRouteCoordinatesJSON } from '../src/lib/sync/parser'

async function main() {
  console.log('Starting route_coordinates backfill...\n')

  // Find activities that have GPX data but no route_coordinates yet
  const eligible = await db
    .select({
      id: activities.id,
      title: activities.title,
      gpxData: activities.gpxData,
    })
    .from(activities)
    .where(and(isNotNull(activities.gpxData), isNull(activities.routeCoordinates)))

  if (eligible.length === 0) {
    console.log(
      'Nothing to backfill — all activities with GPX data already have route_coordinates.',
    )
    return
  }

  console.log(`Found ${eligible.length} activities to backfill.\n`)

  let success = 0
  let skipped = 0

  for (let i = 0; i < eligible.length; i++) {
    const activity = eligible[i]
    const coords = extractRouteCoordinatesJSON(activity.gpxData!)

    if (coords) {
      const parsed = JSON.parse(coords) as unknown[]
      await db
        .update(activities)
        .set({ routeCoordinates: coords })
        .where(eq(activities.id, activity.id))
      success++
      console.log(`  [${i + 1}/${eligible.length}] ${activity.title}: ${parsed.length} points`)
    } else {
      skipped++
      console.log(
        `  [${i + 1}/${eligible.length}] ${activity.title}: no coordinates found, skipped`,
      )
    }
  }

  console.log('\n==================================================')
  console.log('Route coordinates backfill completed!')
  console.log(`Processed: ${eligible.length} activities`)
  console.log(`Success:   ${success}`)
  console.log(`Skipped:   ${skipped}`)
  console.log('==================================================\n')
}

main()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
