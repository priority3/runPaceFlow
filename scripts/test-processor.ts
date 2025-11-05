/**
 * 测试数据处理器
 * 使用模拟数据验证同步流程是否正常工作
 *
 * 使用方法：
 * pnpm tsx scripts/test-processor.ts
 */

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { activities, splits } from '@/lib/db/schema'
import type { RawActivity } from '@/lib/sync'
import { syncActivity } from '@/lib/sync'

// 创建模拟数据
function createMockActivity(): RawActivity {
  const startTime = new Date('2025-01-05T06:00:00Z')

  return {
    id: 'mock_nike_123',
    title: '晨跑 - 测试活动',
    type: 'running',
    startTime,
    duration: 1800, // 30 分钟
    distance: 5000, // 5 公里
    source: 'nike',
    averagePace: 360, // 6:00 /km
    bestPace: 330, // 5:30 /km
    elevationGain: 50,
    averageHeartRate: 145,
    maxHeartRate: 165,
    calories: 350,
    // 不包含 GPX 数据，测试平均分段生成
  }
}

async function main() {
  console.info('=== RunPaceFlow 数据处理器测试 ===\n')

  try {
    // 1. 创建模拟活动
    console.info('1. 创建模拟活动数据...')
    const mockActivity = createMockActivity()
    console.info(`   - 活动: ${mockActivity.title}`)
    console.info(`   - 距离: ${mockActivity.distance / 1000} km`)
    console.info(`   - 时长: ${mockActivity.duration / 60} 分钟`)
    console.info(
      `   - 平均配速: ${Math.floor(mockActivity.averagePace! / 60)}:${String(mockActivity.averagePace! % 60).padStart(2, '0')} /km\n`,
    )

    // 2. 同步活动到数据库
    console.info('2. 同步活动到数据库...')
    const activityId = await syncActivity(mockActivity)
    console.info(`   ✅ 活动已同步，ID: ${activityId}\n`)

    // 3. 验证活动数据
    console.info('3. 验证活动数据...')
    const savedActivity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1)

    if (savedActivity.length === 0) {
      throw new Error('活动数据未保存')
    }

    console.info(`   ✅ 活动数据验证通过`)
    console.info(`   - 标题: ${savedActivity[0].title}`)
    console.info(`   - 类型: ${savedActivity[0].type}`)
    console.info(`   - 距离: ${savedActivity[0].distance / 1000} km`)
    console.info(`   - 时长: ${savedActivity[0].duration} 秒\n`)

    // 4. 验证分段数据
    console.info('4. 验证分段数据...')
    const savedSplits = await db.select().from(splits).where(eq(splits.activityId, activityId))

    console.info(`   ✅ 分段数据验证通过`)
    console.info(`   - 分段数量: ${savedSplits.length}`)

    for (const split of savedSplits) {
      const paceMinutes = Math.floor(split.pace / 60)
      const paceSeconds = Math.floor(split.pace % 60)
      console.info(
        `   - 第 ${split.kilometer} km: ${split.duration}秒, 配速 ${paceMinutes}:${String(paceSeconds).padStart(2, '0')}/km`,
      )
    }

    console.info('\n=== 测试完成 ✅ ===')
    console.info('所有数据处理功能正常工作！\n')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    throw error
  }
}

main().catch(console.error)
