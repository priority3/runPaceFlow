import fs from 'node:fs'
import path from 'node:path'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

/**
 * 数据库配置
 * 可通过 DATABASE_URL 环境变量覆盖（推荐：Turso / libSQL 远程数据库）
 *
 * Notes:
 * - Vercel Serverless 运行时文件系统基本只读（除了 /tmp）。
 * - 预览环境（Preview）如果未配置 DATABASE_URL，也不应在构建阶段因 SQLite 路径不可写而失败。
 */
const getDatabaseUrl = () => {
  // 如果有环境变量，直接使用
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // 在 Vercel 环境中，优先使用 /tmp（可写），避免构建/运行时因为 data 目录不存在而失败
  if (process.env.VERCEL) {
    return 'file:/tmp/runpaceflow.db'
  }

  // 本地开发环境：默认落到 data/activities.db（若目录不存在则自动创建）
  const dataDir = path.join(process.cwd(), 'data')
  try {
    fs.mkdirSync(dataDir, { recursive: true })
  } catch {
    // Best-effort: directory creation failure will surface as connection error later.
  }

  return `file:${path.join(dataDir, 'activities.db')}`
}

const client = createClient({
  url: getDatabaseUrl(),
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

/**
 * Drizzle ORM 实例
 */
export const db = drizzle(client, { schema })
