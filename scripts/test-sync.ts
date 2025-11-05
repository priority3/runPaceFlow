/**
 * 测试同步功能
 * 用于验证 Nike 数据同步是否正常工作
 *
 * 使用方法：
 * pnpm tsx scripts/test-sync.ts
 */

import { performSync, testConnection } from '@/lib/sync'

async function main() {
  console.info('=== RunPaceFlow 同步测试 ===\n')

  // 1. 测试 Nike 连接
  console.info('1. 测试 Nike Run Club 连接...')
  try {
    const isConnected = await testConnection('nike')
    if (isConnected) {
      console.info('✅ Nike 连接成功\n')
    } else {
      console.info('❌ Nike 连接失败')
      console.info('提示：请在 .env.local 中设置 NIKE_ACCESS_TOKEN 环境变量\n')
      return
    }
  } catch (error) {
    console.error('❌ 连接测试出错:', error)
    return
  }

  // 2. 执行同步
  console.info('2. 开始同步 Nike 活动数据...')
  try {
    const result = await performSync({
      source: 'nike',
      limit: 10, // 限制同步最近 10 条活动
    })

    if (result.success) {
      console.info(`✅ 同步成功！`)
      console.info(`   - 同步的活动数量: ${result.activitiesCount}`)
      console.info(`   - 同步日志 ID: ${result.logId}\n`)
    } else {
      console.info('❌ 同步失败')
      console.info(`   - 错误信息: ${result.errorMessage}\n`)
    }
  } catch (error) {
    console.error('❌ 同步出错:', error)
  }

  console.info('=== 测试完成 ===')
}

main().catch(console.error)
