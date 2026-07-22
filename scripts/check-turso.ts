#!/usr/bin/env bun

/**
 * Quick script to inspect latest data in Turso database.
 * Usage: bun run scripts/check-turso.ts
 */

import fs from 'node:fs'

import { createClient } from '@libsql/client'

// Read .env.local for credentials
function loadEnv() {
  try {
    const content = fs.readFileSync('.env.local', 'utf-8')
    const vars: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) vars[match[1].trim()] = match[2].trim()
    }
    return vars
  } catch {
    return {}
  }
}

const env = loadEnv()
const dbUrl = process.env.DATABASE_URL || env.DATABASE_URL
const dbToken = process.env.DATABASE_AUTH_TOKEN || env.DATABASE_AUTH_TOKEN

if (!dbUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

console.info('DB URL:', `${dbUrl.slice(0, 30)}...`)

const client = createClient({ url: dbUrl, authToken: dbToken })

// Latest 5 activities
const result = await client.execute(
  'SELECT id, title, source, start_time, distance, created_at FROM activities ORDER BY start_time DESC LIMIT 5',
)
console.info('\n=== Latest 5 activities in Turso ===')
for (const row of result.rows) {
  const startDate = new Date(Number(row.start_time) * 1000).toISOString()
  const dist = (Number(row.distance) / 1000).toFixed(2)
  console.info(`  ${startDate} | ${dist}km | ${row.title} | source: ${row.source}`)
}

// Total count
const countResult = await client.execute('SELECT COUNT(*) as cnt FROM activities')
console.info(`\nTotal activities: ${countResult.rows[0].cnt}`)
