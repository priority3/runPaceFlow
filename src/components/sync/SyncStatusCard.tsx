/**
 * Sync Status Card Component
 *
 * Glassmorphic design with backdrop blur
 */

'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, RefreshCw, AlertTriangle } from 'lucide-react'

import { trpc } from '@/lib/trpc/client'

export function SyncStatusCard() {
  const { data: syncStatus, isLoading } = trpc.sync.getSyncStatus.useQuery()

  if (isLoading) {
    return (
      <div className="h-12 animate-pulse rounded-xl bg-white/40 backdrop-blur-xl dark:bg-black/20" />
    )
  }

  const activeProvider = syncStatus?.strava.hasCredentials ? 'strava' : 'nike'
  const providerData = activeProvider === 'strava' ? syncStatus?.strava : syncStatus?.nike
  const providerName = activeProvider === 'strava' ? 'Strava' : 'Nike'

  const isConnected =
    activeProvider === 'strava' ? syncStatus?.strava.hasCredentials : syncStatus?.nike.hasToken

  const latestSync = providerData?.latestSync
  const isSuccess = latestSync?.status === 'success'
  const isRunning = latestSync?.status === 'running'
  const isFailed = latestSync?.status === 'failed'

  return (
    <motion.div
      className="flex items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/50 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-black/20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div className="text-label/50">
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isFailed ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-label font-medium">
            {isRunning ? '正在同步' : isSuccess ? '已同步' : isFailed ? '同步失败' : '未同步'}
          </span>
          {isConnected && <span className="text-label/60">已连接</span>}
          <span className="text-label/40">
            {latestSync
              ? `${providerName} · ${new Date(latestSync.startedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`
              : `${providerName} · 等待首次同步`}
          </span>
        </div>
      </div>

      {isSuccess && latestSync && latestSync.activitiesCount > 0 && (
        <span className="text-label/60 text-sm">+{latestSync.activitiesCount}</span>
      )}
    </motion.div>
  )
}
