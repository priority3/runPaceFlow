/**
 * Nike Sync Button Component
 *
 * Triggers Nike Run Club data synchronization
 */

'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

interface NikeSyncButtonProps {
  onSyncComplete?: () => void
  className?: string
}

export function NikeSyncButton({ onSyncComplete, className = '' }: NikeSyncButtonProps) {
  const [isManualSync, setIsManualSync] = useState(false)

  // Get sync status
  const { data: syncStatus } = trpc.sync.getSyncStatus.useQuery()

  // Sync mutation
  const syncMutation = trpc.sync.syncNike.useMutation({
    onSuccess: (data) => {
      setIsManualSync(false)
      onSyncComplete?.()
      alert(`成功同步 ${data.count} 个活动！`)
    },
    onError: (error) => {
      setIsManualSync(false)
      alert(`同步失败: ${error.message}`)
    },
  })

  const handleSync = () => {
    if (isManualSync || syncMutation.isPending) return

    setIsManualSync(true)
    syncMutation.mutate({ limit: 50 })
  }

  const isSyncing = isManualSync || syncMutation.isPending
  const hasToken = syncStatus?.hasToken

  if (!hasToken) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled
        className={className}
        title="请先配置 NIKE_REFRESH_TOKEN 环境变量"
      >
        未配置 Nike Token
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="lg"
      onClick={handleSync}
      disabled={isSyncing}
      className={className}
    >
      <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? '同步中...' : '同步 Nike 数据'}
    </Button>
  )
}
