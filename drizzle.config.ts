import { defineConfig } from 'drizzle-kit'

const url = process.env.DATABASE_URL ?? 'file:./local.db'
const isRemote = !url.startsWith('file:')

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: isRemote ? 'turso' : 'sqlite',
  // drizzle-kit uses a dedicated "turso" dialect to support remote libsql://
  // connections (auth token, etc). Local SQLite files still use "sqlite".
  dbCredentials: isRemote
    ? {
        url,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      }
    : {
        url,
      },
})
