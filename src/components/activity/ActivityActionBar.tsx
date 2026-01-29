/**
 * ActivityActionBar Component
 *
 * Bottom action bar for activity detail page with share and export options
 * Mobile-optimized with fixed positioning
 */

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Download, FileText, Image as ImageIcon, Share2, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface ActivityActionBarProps {
  activityId: string
  activityTitle: string
  className?: string
  /** Callback when share is triggered */
  onShare?: () => void
  /** Callback when export is triggered */
  onExport?: (format: 'gpx' | 'image') => void
}

export function ActivityActionBar({
  activityId,
  activityTitle,
  className,
  onShare,
  onExport,
}: ActivityActionBarProps) {
  const [showShareMenu, setShowShareMenu] = React.useState(false)
  const [showExportMenu, setShowExportMenu] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowShareMenu(false)
      setShowExportMenu(false)
    }

    if (showShareMenu || showExportMenu) {
      // Delay to prevent immediate close
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
      }, 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
      }
    }
    return
  }, [showShareMenu, showExportMenu])

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/activity/${activityId}`

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: activityTitle,
          text: `查看我的跑步记录: ${activityTitle}`,
          url: shareUrl,
        })
        onShare?.()
        return
      } catch (err) {
        // User cancelled or share failed, fall back to menu
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Show share menu on desktop
    setShowShareMenu(true)
    setShowExportMenu(false)
  }

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/activity/${activityId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onShare?.()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleExport = (format: 'gpx' | 'image') => {
    setShowExportMenu(false)
    onExport?.(format)
  }

  return (
    <>
      {/* Fixed bottom action bar - only visible on mobile */}
      <motion.div
        className={cn(
          'fixed right-0 bottom-0 left-0 z-40 border-t border-white/20 bg-white/80 px-4 py-3 backdrop-blur-xl sm:hidden dark:border-white/10 dark:bg-black/80',
          className,
        )}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around gap-4">
          {/* Share button */}
          <motion.button
            type="button"
            onClick={handleShare}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors active:bg-white/50 dark:active:bg-white/10"
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="text-blue h-5 w-5" />
            <span className="text-label/70 text-xs">分享</span>
          </motion.button>

          {/* Export button */}
          <motion.button
            type="button"
            onClick={() => {
              setShowExportMenu(!showExportMenu)
              setShowShareMenu(false)
            }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors active:bg-white/50 dark:active:bg-white/10"
            whileTap={{ scale: 0.95 }}
          >
            <Download className="text-green h-5 w-5" />
            <span className="text-label/70 text-xs">导出</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Desktop floating action buttons */}
      <div className="fixed right-6 bottom-6 z-40 hidden flex-col gap-3 sm:flex">
        {/* Share button */}
        <motion.button
          type="button"
          onClick={handleShare}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl transition-colors hover:bg-white dark:border-white/10 dark:bg-black/60 dark:hover:bg-black/80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="分享"
        >
          <Share2 className="text-blue h-5 w-5" />
        </motion.button>

        {/* Export button */}
        <motion.button
          type="button"
          onClick={() => {
            setShowExportMenu(!showExportMenu)
            setShowShareMenu(false)
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl transition-colors hover:bg-white dark:border-white/10 dark:bg-black/60 dark:hover:bg-black/80"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="导出"
        >
          <Download className="text-green h-5 w-5" />
        </motion.button>
      </div>

      {/* Share menu popup */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            className="fixed right-4 bottom-20 z-50 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-xl backdrop-blur-xl sm:right-20 sm:bottom-24 dark:border-white/10 dark:bg-black/90"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-label text-sm font-medium">分享活动</span>
              <button
                type="button"
                onClick={() => setShowShareMenu(false)}
                className="text-label/40 hover:text-label/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-label/80 hover:bg-label/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              >
                {copied ? <Check className="text-green h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? '已复制!' : '复制链接'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export menu popup */}
      <AnimatePresence>
        {showExportMenu && (
          <motion.div
            className="fixed right-4 bottom-20 z-50 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-xl backdrop-blur-xl sm:right-20 sm:bottom-12 dark:border-white/10 dark:bg-black/90"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-label text-sm font-medium">导出格式</span>
              <button
                type="button"
                onClick={() => setShowExportMenu(false)}
                className="text-label/40 hover:text-label/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={() => handleExport('gpx')}
                className="text-label/80 hover:bg-label/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              >
                <FileText className="text-blue h-4 w-4" />
                <div className="text-left">
                  <div>GPX 文件</div>
                  <div className="text-label/40 text-xs">可导入其他运动应用</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleExport('image')}
                className="text-label/80 hover:bg-label/5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
              >
                <ImageIcon className="text-purple h-4 w-4" />
                <div className="text-left">
                  <div>图片分享</div>
                  <div className="text-label/40 text-xs">生成精美分享图</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for mobile to prevent content being hidden by action bar */}
      <div className="h-20 sm:hidden" />
    </>
  )
}
