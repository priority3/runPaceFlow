/**
 * Migration Script: Fix Activity Titles
 *
 * Problem: Activity titles were incorrectly rounded to special names (e.g., 4.81km → "🏅 5K").
 * Fix: Re-fetch original names from Strava, then apply the updated naming logic
 * which only assigns special names for 3K/5K/10K/半马/全马 with tight tolerances.
 *
 * Usage: npx tsx scripts/fix-activity-titles.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

import { createClient } from '@libsql/client'

// Load environment variables from .env.local
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) {
    process.env[key] = value
  }
}

const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

// Duplicated from naming.ts to avoid build/import issues in scripts
interface DistanceCategory {
  name: string
  minDistance: number
  maxDistance: number
}

// Reason: These tight ranges match the updated naming.ts logic
// Short races: ±200m. Marathons: asymmetric, allows GPS drift above standard.
const DISTANCE_CATEGORIES: DistanceCategory[] = [
  { name: '🏅 3K', minDistance: 2800, maxDistance: 3200 },
  { name: '🏅 5K', minDistance: 4800, maxDistance: 5200 },
  { name: '🏅 10K', minDistance: 9800, maxDistance: 10200 },
  { name: '🏅 半程马拉松', minDistance: 20800, maxDistance: 21800 },
  { name: '🏅 全程马拉松', minDistance: 41900, maxDistance: 42900 },
]

function getDistanceCategory(distanceMeters: number): string | null {
  for (const category of DISTANCE_CATEGORIES) {
    if (distanceMeters >= category.minDistance && distanceMeters < category.maxDistance) {
      return category.name
    }
  }
  return null
}

function generateSmartName(
  distance: number,
  originalName: string,
  raceName: string | null,
): string {
  if (raceName) return raceName
  const category = getDistanceCategory(distance)
  if (category) return category
  return originalName
}

async function refreshStravaToken(): Promise<string> {
  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Strava credentials (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN)',
    )
  }

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token
}

interface StravaListActivity {
  id: number
  name: string
  distance: number
  type: string
}

async function fetchStravaActivities(accessToken: string): Promise<StravaListActivity[]> {
  const all: StravaListActivity[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new Error(`Strava API error: ${res.status} ${await res.text()}`)
    }

    const activities: StravaListActivity[] = await res.json()
    if (activities.length === 0) break

    all.push(...activities)
    page++
  }

  return all
}

async function main() {
  console.log('🔧 Fix Activity Titles Migration\n')

  // Step 1: Connect to Turso DB
  const dbUrl = process.env.DATABASE_URL
  const dbToken = process.env.DATABASE_AUTH_TOKEN
  if (!dbUrl) throw new Error('DATABASE_URL not set')

  const db = createClient({ url: dbUrl, authToken: dbToken })

  // Step 2: Get all activities from DB
  const dbResult = await db.execute(
    'SELECT id, title, distance, source_id, race_name FROM activities',
  )
  const dbActivities = dbResult.rows
  console.log(`📊 Found ${dbActivities.length} activities in database\n`)

  // Step 3: Authenticate with Strava
  console.log('🔑 Authenticating with Strava...')
  const accessToken = await refreshStravaToken()
  console.log('✅ Strava authenticated\n')

  // Step 4: Fetch all Strava activities (just list, no streams)
  console.log('📥 Fetching activity list from Strava...')
  const stravaActivities = await fetchStravaActivities(accessToken)
  console.log(`📥 Got ${stravaActivities.length} activities from Strava\n`)

  // Build a lookup map: strava_id → original name
  const stravaNameMap = new Map<string, string>()
  for (const sa of stravaActivities) {
    stravaNameMap.set(sa.id.toString(), sa.name)
  }

  // Step 5: Compare and fix titles
  let updated = 0
  let skipped = 0

  for (const row of dbActivities) {
    const sourceId = row.source_id as string
    const currentTitle = row.title as string
    const distance = Number(row.distance)
    const raceName = row.race_name as string | null

    const originalName = stravaNameMap.get(sourceId)
    if (!originalName) {
      console.log(`⚠️  No Strava match for source_id=${sourceId}, skipping`)
      skipped++
      continue
    }

    const correctTitle = generateSmartName(distance, originalName, raceName)

    if (correctTitle !== currentTitle) {
      const km = (distance / 1000).toFixed(2)
      console.log(`📝 ${km}km: "${currentTitle}" → "${correctTitle}"`)

      await db.execute({
        sql: 'UPDATE activities SET title = ? WHERE id = ?',
        args: [correctTitle, row.id as string],
      })
      updated++
    } else {
      skipped++
    }
  }

  console.log(`\n✅ Done! Updated: ${updated}, Unchanged: ${skipped}`)
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
