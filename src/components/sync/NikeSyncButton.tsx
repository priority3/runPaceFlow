/**
 * Nike Sync Button Component
 *
 * Triggers Nike Run Club data synchronization with enhanced animations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

interface NikeSyncButtonProps {
  onSyncComplete?: () => void
  className?: string
}

export function NikeSyncButton({ onSyncComplete, className = '' }: NikeSyncButtonProps) {
  const [isManualSync, setIsManualSync] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  // Get sync status
  const { data: syncStatus } = trpc.sync.getSyncStatus.useQuery()

  // Sync mutation
  const syncMutation = trpc.sync.syncNike.useMutation({
    onSuccess: (data) => {
      setIsManualSync(false)
      setShowSuccess(true)
      onSyncComplete?.()

      // Show success notification
      setTimeout(() => setShowSuccess(false), 3000)
      alert(`成功同步 ${data.count} 个活动！`)
    },
    onError: (error) => {
      setIsManualSync(false)
      setShowError(true)

      // Show error notification
      setTimeout(() => setShowError(false), 3000)
      alert(`同步失败: ${error.message}`)
    },
  })

  const handleSync = () => {
    if (isManualSync || syncMutation.isPending) return

    setIsManualSync(true)
    setShowSuccess(false)
    setShowError(false)
    syncMutation.mutate({ limit: 50 })
  }

  const isSyncing = isManualSync || syncMutation.isPending
  const hasToken = syncStatus?.nike.hasToken

  // Reset success/error states when not syncing
  useEffect(() => {
    if (!isSyncing) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
        setShowError(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isSyncing])

  if (!hasToken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="outline"
          size="lg"
          disabled
          className={className}
          title="请先配置 NIKE_REFRESH_TOKEN 环境变量"
        >
          <AlertCircle className="size-4" />
          未配置 Nike Token
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant={showSuccess ? 'default' : showError ? 'destructive' : 'default'}
        size="lg"
        onClick={handleSync}
        disabled={isSyncing}
        className={`relative overflow-hidden ${className}`}
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2"
            >
              <Check className="size-4" />
              同步成功
            </motion.div>
          ) : showError ? (
            <motion.div
              key="error"
              initial={{ scale: 0, x: -10 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex items-center gap-2"
            >
              <AlertCircle className="size-4" />
              同步失败
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={
                  isSyncing
                    ? {
                        rotate: 360,
                        transition: {
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                      }
                    : { rotate: 0 }
                }
              >
                <RefreshCw className="size-4" />
              </motion.div>
              <motion.span
                key={isSyncing ? 'syncing' : 'idle'}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isSyncing ? '同步中...' : '同步 Nike 数据'}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator background */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              className="bg-primary-foreground/20 absolute inset-0"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  )
}
