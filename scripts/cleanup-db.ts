#!/usr/bin/env bun

/**
 * Database Cleanup Script
 *
 * Removes non-running activities and their associated splits from the database.
 * Run this once to clean historical data before implementing incremental sync.
 *
 * Usage: bun run scripts/cleanup-db.ts [--dry-run]
 */

import { ne, sql } from 'drizzle-orm'

import { db } from '../src/lib/db'
import { activities, splits } from '../src/lib/db/schema'

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.info('🧹 Database Cleanup Script')
  console.info(`📅 ${new Date().toISOString()}`)
  console.info(`🔧 Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.info('')

  // Step 1: Show current state
  console.info('📊 Current database state:')
  const typeCountsResult = await db
    .select({
      type: activities.type,
      count: sql<number>`count(*)`,
    })
    .from(activities)
    .groupBy(activities.type)

  for (const row of typeCountsResult) {
    console.info(`   ${row.type}: ${row.count} activities`)
  }
  console.info('')

  // Step 2: Find non-running activities
  const nonRunningActivities = await db
    .select({ id: activities.id, type: activities.type, title: activities.title })
    .from(activities)
    .where(ne(activities.type, 'running'))

  if (nonRunningActivities.length === 0) {
    console.info('✅ No non-running activities found. Database is clean!')
    return
  }

  console.info(`🗑️  Found ${nonRunningActivities.length} non-running activities to remove:`)
  for (const activity of nonRunningActivities) {
    console.info(`   - [${activity.type}] ${activity.title} (${activity.id})`)
  }
  console.info('')

  if (isDryRun) {
    console.info('⚠️  DRY RUN: No changes made. Run without --dry-run to delete.')
    return
  }

  // Step 3: Delete non-running activities (splits cascade automatically)
  console.info('🔄 Deleting non-running activities...')

  await db.delete(activities).where(ne(activities.type, 'running'))

  console.info(`✅ Deleted ${nonRunningActivities.length} activities`)
  console.info('')

  // Step 4: Verify final state
  console.info('📊 Final database state:')
  const finalCountsResult = await db
    .select({
      type: activities.type,
      count: sql<number>`count(*)`,
    })
    .from(activities)
    .groupBy(activities.type)

  for (const row of finalCountsResult) {
    console.info(`   ${row.type}: ${row.count} activities`)
  }

  const totalActivities = await db.select({ count: sql<number>`count(*)` }).from(activities)
  const totalSplits = await db.select({ count: sql<number>`count(*)` }).from(splits)

  console.info('')
  console.info('📈 Summary:')
  console.info(`   Total activities: ${totalActivities[0].count}`)
  console.info(`   Total splits: ${totalSplits[0].count}`)
  console.info('')
  console.info('✨ Cleanup completed successfully!')
}

main().catch((error) => {
  console.error('❌ Cleanup failed:', error)
  process.exit(1)
})
