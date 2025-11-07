/**
 * Sync Status Card Component
 *
 * Displays last sync information and status for multiple providers
 * Priority: Strava > Nike
 */

'use client'

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

import { trpc } from '@/lib/trpc/client'

export function SyncStatusCard() {
  const { data: syncStatus, isLoading } = trpc.sync.getSyncStatus.useQuery()

  if (isLoading) {
    return (
      <div className="border-separator bg-secondarySystemBackground animate-pulse rounded-lg border p-4">
        <div className="bg-fill h-20 rounded" />
      </div>
    )
  }

  // Determine active provider (Priority: Strava > Nike)
  const activeProvider = syncStatus?.strava.hasCredentials ? 'strava' : 'nike'
  const providerData = activeProvider === 'strava' ? syncStatus?.strava : syncStatus?.nike
  const providerName = activeProvider === 'strava' ? 'Strava' : 'Nike Run Club'

  // Get configuration status
  let configStatus = '未配置'
  if (activeProvider === 'strava') {
    configStatus = syncStatus?.strava.hasCredentials ? '✓ OAuth 认证' : '未配置'
  } else {
    configStatus = syncStatus?.nike.hasRefreshToken
      ? '🔄 自动刷新（30天）'
      : syncStatus?.nike.hasToken
        ? '⏰ 手动更新（1-2小时）'
        : '未配置'
  }

  if (!providerData?.latestSync) {
    return (
      <div className="border-separator bg-secondarySystemBackground rounded-lg border p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-secondaryLabel size-5" />
            <div>
              <h3 className="text-label text-sm font-medium">同步状态</h3>
              <p className="text-secondaryLabel text-xs">还未进行过数据同步 ({providerName})</p>
            </div>
          </div>
          <div className="text-tertiaryLabel text-xs">{configStatus}</div>
        </div>
      </div>
    )
  }

  const { latestSync } = providerData
  const isSuccess = latestSync.status === 'success'
  const isFailed = latestSync.status === 'failed'
  const isRunning = latestSync.status === 'running'

  const Icon = isSuccess ? CheckCircle2 : isFailed ? AlertCircle : Clock
  const iconColor = isSuccess ? 'text-green' : isFailed ? 'text-red' : 'text-orange'

  return (
    <div className="border-separator bg-secondarySystemBackground rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`size-5 ${iconColor}`} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-label text-sm font-medium">最近同步 ({providerName})</h3>
              <span className="text-tertiaryLabel text-xs">{configStatus}</span>
            </div>
            <p className="text-secondaryLabel mt-1 text-xs">
              {new Date(latestSync.startedAt).toLocaleString('zh-CN')}
            </p>
            {isSuccess && (
              <p className="text-green mt-1 text-xs">
                成功同步 {latestSync.activitiesCount || 0} 个活动
              </p>
            )}
            {isFailed && (
              <p className="text-red mt-1 text-xs">
                同步失败: {latestSync.errorMessage || '未知错误'}
              </p>
            )}
            {isRunning && <p className="text-orange mt-1 text-xs">同步进行中...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
