/**
 * Database migration runner
 * Uses Drizzle's official migrator to apply versioned SQL migrations from ./drizzle
 */

import { migrate } from 'drizzle-orm/libsql/migrator'

import { db } from '@/lib/db'

/**
 * Run database migrations
 * Applies all pending migrations from the drizzle/ folder.
 * Tracked by the __drizzle_migrations table — already-applied migrations are skipped.
 */
export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' })
}

// Reason: Allow direct execution via `bun run src/lib/db/migrate.ts`
// while still exporting runMigrations for programmatic use (e.g. from sync script)
if (import.meta.main) {
  runMigrations()
    .then(() => {
      console.log('✓ Migrations applied successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
