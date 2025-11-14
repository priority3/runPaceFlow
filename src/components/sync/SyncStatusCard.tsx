/**
 * Sync Status Card Component
 *
 * Displays last sync information and status for multiple providers
 * Priority: Strava > Nike
 * Enhanced with better visual design and Apple UIKit colors
 */

'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

import { trpc } from '@/lib/trpc/client'

export function SyncStatusCard() {
  const { data: syncStatus, isLoading } = trpc.sync.getSyncStatus.useQuery()

  if (isLoading) {
    return (
      <div className="bg-secondary-system-fill animate-pulse rounded-2xl p-6">
        <div className="bg-tertiary-system-fill h-20 rounded-xl" />
      </div>
    )
  }

  // Determine active provider (Priority: Strava > Nike)
  const activeProvider = syncStatus?.strava.hasCredentials ? 'strava' : 'nike'
  const providerData = activeProvider === 'strava' ? syncStatus?.strava : syncStatus?.nike
  const providerName = activeProvider === 'strava' ? 'Strava' : 'Nike Run Club'

  // Get configuration status
  let configStatus = '未配置'
  let configBadgeColor = 'bg-gray/10 text-gray'

  if (activeProvider === 'strava') {
    if (syncStatus?.strava.hasCredentials) {
      configStatus = 'OAuth 认证'
      configBadgeColor = 'bg-green/10 text-green'
    }
  } else {
    if (syncStatus?.nike.hasRefreshToken) {
      configStatus = '自动刷新'
      configBadgeColor = 'bg-blue/10 text-blue'
    } else if (syncStatus?.nike.hasToken) {
      configStatus = '手动更新'
      configBadgeColor = 'bg-orange/10 text-orange'
    }
  }

  if (!providerData?.latestSync) {
    return (
      <motion.div
        className="border-separator bg-secondary-system-background rounded-2xl border p-6 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-system-fill rounded-xl p-3">
              <Clock className="text-secondary-label size-6" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-label text-base font-semibold">同步状态</h3>
                <span
                  className={`${configBadgeColor} rounded-full px-2.5 py-0.5 text-xs font-medium`}
                >
                  {configStatus}
                </span>
              </div>
              <p className="text-secondary-label text-sm">还未进行过数据同步</p>
              <p className="text-tertiary-label mt-1 text-xs">来源: {providerName}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const { latestSync } = providerData
  const isSuccess = latestSync.status === 'success'
  const isFailed = latestSync.status === 'failed'
  const isRunning = latestSync.status === 'running'

  const Icon = isSuccess ? CheckCircle2 : isFailed ? AlertCircle : isRunning ? RefreshCw : Clock
  const iconBgColor = isSuccess
    ? 'bg-green/10'
    : isFailed
      ? 'bg-red/10'
      : isRunning
        ? 'bg-blue/10'
        : 'bg-orange/10'
  const iconColor = isSuccess
    ? 'text-green'
    : isFailed
      ? 'text-red'
      : isRunning
        ? 'text-blue'
        : 'text-orange'

  return (
    <motion.div
      className="border-separator bg-secondary-system-background rounded-2xl border p-6 shadow-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div className={`${iconBgColor} flex-shrink-0 rounded-xl p-3`}>
            <Icon className={`${iconColor} size-6 ${isRunning ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-label text-base font-semibold">
                {isSuccess ? '同步成功' : isFailed ? '同步失败' : isRunning ? '同步中' : '最近同步'}
              </h3>
              <span
                className={`${configBadgeColor} rounded-full px-2.5 py-0.5 text-xs font-medium`}
              >
                {configStatus}
              </span>
              <span className="bg-system-fill text-tertiary-label rounded-full px-2.5 py-0.5 text-xs font-medium">
                {providerName}
              </span>
            </div>

            <p className="text-secondary-label mb-2 text-sm">
              {new Date(latestSync.startedAt).toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            {isSuccess && (
              <div className="border-green/20 bg-green/5 inline-block rounded-lg border px-3 py-2">
                <p className="text-green text-sm font-medium">
                  成功同步 {latestSync.activitiesCount || 0} 个活动
                </p>
              </div>
            )}

            {isFailed && (
              <div className="border-red/20 bg-red/5 rounded-lg border px-3 py-2">
                <p className="text-red text-sm font-medium">
                  {latestSync.errorMessage || '同步失败，请稍后重试'}
                </p>
              </div>
            )}

            {isRunning && (
              <div className="border-blue/20 bg-blue/5 inline-block rounded-lg border px-3 py-2">
                <p className="text-blue text-sm font-medium">正在同步活动数据...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
