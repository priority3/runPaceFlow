/**
 * Backfill weather data for existing outdoor activities
 *
 * Standalone entry point that reuses the shared backfill logic from processor.
 * Can also be triggered automatically as part of the daily sync workflow.
 *
 * Usage: bun run scripts/backfill-weather.ts
 */

import { backfillMissingWeather } from '../src/lib/sync/processor'

async function main() {
  console.log('🌤️  Starting weather data backfill...\n')

  const result = await backfillMissingWeather()

  if (result.total === 0) {
    console.log('✅ Nothing to backfill — all outdoor activities already have weather data.')
    return
  }

  console.log('\n==================================================')
  console.log('✨ Weather backfill completed!')
  console.log(`📈 Processed: ${result.total} activities`)
  console.log(`✅ Success:   ${result.success}`)
  console.log(`❌ Failed:    ${result.failed}`)
  console.log(`⏭️  Skipped:   ${result.skipped}`)
  console.log('==================================================\n')
}

main()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
