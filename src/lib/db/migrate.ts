/**
 * Database migration runner
 * Runs migrations on application startup to ensure schema is up to date
 */

import path from 'node:path'

import { createClient } from '@libsql/client'

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  if (process.env.VERCEL) {
    return `file:${path.join(process.cwd(), 'data', 'activities.db')}`
  }

  return 'file:./data/activities.db'
}

/**
 * Run database migrations
 * This ensures the database schema is up to date
 */
export async function runMigrations() {
  const client = createClient({
    url: getDatabaseUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })

  try {
    // Check if race_name column exists
    const tableInfo = await client.execute({
      sql: 'PRAGMA table_info(activities)',
      args: [],
    })

    const hasRaceNameColumn = tableInfo.rows.some((row: any) => row.name === 'race_name')

    if (!hasRaceNameColumn) {
      console.log('Adding race_name column to activities table...')
      await client.execute({
        sql: 'ALTER TABLE activities ADD COLUMN race_name TEXT',
        args: [],
      })
      console.log('✓ race_name column added successfully')
    } else {
      console.log('✓ race_name column already exists')
    }

    // Check if is_indoor column exists
    const hasIsIndoorColumn = tableInfo.rows.some((row: any) => row.name === 'is_indoor')

    if (!hasIsIndoorColumn) {
      console.log('Adding is_indoor column to activities table...')
      await client.execute({
        sql: 'ALTER TABLE activities ADD COLUMN is_indoor INTEGER DEFAULT 0',
        args: [],
      })
      console.log('✓ is_indoor column added successfully')
    } else {
      console.log('✓ is_indoor column already exists')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.close()
  }
}
