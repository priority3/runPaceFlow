/**
 * Database migration: Add race_name column to activities table
 *
 * This migration adds the race_name column for storing matched race names
 * from the on-demand race matching feature.
 */

import Database from 'better-sqlite3'
import { resolve } from 'path'

const dbPath = resolve(process.cwd(), 'data/activities.db')

console.log('Running migration: Add race_name column')
console.log(`Database: ${dbPath}`)

const db = new Database(dbPath)

try {
  // Check if column already exists
  const tableInfo = db.pragma('table_info(activities)')
  const hasRaceName = tableInfo.some((col: any) => col.name === 'race_name')

  if (hasRaceName) {
    console.log('✓ Column race_name already exists, skipping migration')
  } else {
    // Add the column
    db.exec('ALTER TABLE activities ADD COLUMN race_name TEXT')
    console.log('✓ Added race_name column to activities table')
  }

  db.close()
  console.log('Migration completed successfully')
} catch (error) {
  console.error('Migration failed:', error)
  db.close()
  process.exit(1)
}
