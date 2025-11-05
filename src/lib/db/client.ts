import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

/**
 * 数据库配置
 * 开发环境使用本地 SQLite 文件
 * 生产环境使用 Turso
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:./local.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

/**
 * Drizzle ORM 实例
 */
export const db = drizzle(client, { schema })
