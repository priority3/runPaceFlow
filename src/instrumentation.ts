/**
 * Next.js Instrumentation
 * Runs once when the server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/db/migrate')

    try {
      console.log('Running database migrations...')
      await runMigrations()
      console.log('Database migrations completed successfully')
    } catch (error) {
      console.error('Failed to run database migrations:', error)
      // Don't throw - allow app to start even if migrations fail
      // This prevents deployment failures
    }
  }
}
