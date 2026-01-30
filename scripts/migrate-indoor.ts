#!/usr/bin/env bun

/**
 * Migration Script: Add isIndoor field
 *
 * 1. Adds is_indoor column to activities table if not exists
 * 2. Updates existing activities: marks those without GPX data as indoor
 *
 * Usage: bun run scripts/migrate-indoor.ts [--dry-run]
 */

import { sql } from 'drizzle-orm'

import { db } from '../src/lib/db'

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.info('🔄 Migration: Add isIndoor field')
  console.info(`📅 ${new Date().toISOString()}`)
  console.info(`🔧 Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.info('')

  // Step 1: Check if column exists, add if not
  console.info('📋 Step 1: Checking schema...')

  try {
    // Try to add the column (will fail silently if exists)
    await db.run(sql`ALTER TABLE activities ADD COLUMN is_indoor INTEGER DEFAULT 0`)
    console.info('   ✅ Added is_indoor column')
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.info('   ℹ️  is_indoor column already exists')
    } else {
      console.info('   ℹ️  Column may already exist or other error:', error.message)
    }
  }

  // Step 2: Show current state
  console.info('')
  console.info('📊 Step 2: Analyzing activities...')

  const stats = await db.all(sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN gpx_data IS NULL OR length(gpx_data) < 100 THEN 1 ELSE 0 END) as no_gpx,
      SUM(CASE WHEN elevation_gain = 0 OR elevation_gain IS NULL THEN 1 ELSE 0 END) as no_elevation,
      SUM(CASE WHEN is_indoor = 1 THEN 1 ELSE 0 END) as marked_indoor
    FROM activities
  `)

  const stat = stats[0] as any
  console.info(`   Total activities: ${stat.total}`)
  console.info(`   Without GPX data: ${stat.no_gpx}`)
  console.info(`   Without elevation: ${stat.no_elevation}`)
  console.info(`   Already marked indoor: ${stat.marked_indoor}`)

  // Step 3: Find activities to mark as indoor
  console.info('')
  console.info('📋 Step 3: Finding indoor activities...')

  const indoorCandidates = await db.all(sql`
    SELECT id, title, distance, duration, elevation_gain
    FROM activities
    WHERE (gpx_data IS NULL OR length(gpx_data) < 100)
      AND is_indoor = 0
  `)

  if (indoorCandidates.length === 0) {
    console.info('   ✅ No activities need to be marked as indoor')
    return
  }

  console.info(`   Found ${indoorCandidates.length} activities to mark as indoor:`)
  for (const activity of indoorCandidates as any[]) {
    const distanceKm = (activity.distance / 1000).toFixed(2)
    console.info(`   - ${activity.title} (${distanceKm} km)`)
  }

  if (isDryRun) {
    console.info('')
    console.info('⚠️  DRY RUN: No changes made. Run without --dry-run to apply.')
    return
  }

  // Step 4: Update activities
  console.info('')
  console.info('🔄 Step 4: Updating activities...')

  await db.run(sql`
    UPDATE activities
    SET is_indoor = 1
    WHERE (gpx_data IS NULL OR length(gpx_data) < 100)
      AND is_indoor = 0
  `)

  console.info(`   ✅ Marked ${indoorCandidates.length} activities as indoor`)

  // Step 5: Verify
  console.info('')
  console.info('📊 Step 5: Verification...')

  const finalStats = await db.all(sql`
    SELECT
      SUM(CASE WHEN is_indoor = 1 THEN 1 ELSE 0 END) as indoor,
      SUM(CASE WHEN is_indoor = 0 THEN 1 ELSE 0 END) as outdoor
    FROM activities
  `)

  const final = finalStats[0] as any
  console.info(`   Indoor activities: ${final.indoor}`)
  console.info(`   Outdoor activities: ${final.outdoor}`)

  console.info('')
  console.info('✨ Migration completed successfully!')
}

main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
