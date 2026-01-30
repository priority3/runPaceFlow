'use client'

import { motion } from 'framer-motion'
import { Copy, Download, Share2 } from 'lucide-react'
import { useState } from 'react'

import type { SocialPreset } from '@/lib/art/export'
import { socialPresets } from '@/lib/art/export'

interface ArtExportButtonProps {
  onDownload: (preset: SocialPreset) => Promise<void>
  onCopy?: () => Promise<void>
  onShare?: () => Promise<void>
  disabled?: boolean
}

/**
 * Export button with social media presets dropdown
 */
export function ArtExportButton({ onDownload, onCopy, onShare, disabled }: ArtExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDownload = async (preset: SocialPreset) => {
    setIsExporting(true)
    try {
      await onDownload(preset)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const handleCopy = async () => {
    if (!onCopy) return
    try {
      await onCopy()
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleShare = async () => {
    if (!onShare) return
    try {
      await onShare()
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Copy button */}
      {onCopy && (
        <motion.button
          onClick={handleCopy}
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm font-medium backdrop-blur-xl transition-colors hover:bg-white/80 disabled:opacity-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
          whileTap={{ scale: 0.98 }}
        >
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">{copySuccess ? '已复制' : '复制'}</span>
        </motion.button>
      )}

      {/* Share button */}
      {onShare && typeof navigator !== 'undefined' && 'share' in navigator && (
        <motion.button
          onClick={handleShare}
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/60 px-3 py-2 text-sm font-medium backdrop-blur-xl transition-colors hover:bg-white/80 disabled:opacity-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/40"
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">分享</span>
        </motion.button>
      )}

      {/* Download dropdown */}
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isExporting}
          className="bg-blue/90 hover:bg-blue flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition-colors disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? '导出中...' : '导出'}</span>
        </motion.button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-white/20 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/80"
            >
              <div className="py-1">
                {(Object.keys(socialPresets) as SocialPreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDownload(preset)}
                    className="text-label hover:bg-fill-tertiary flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors"
                  >
                    <span>{socialPresets[preset].name}</span>
                    <span className="text-label/50 text-xs">
                      {socialPresets[preset].width}×{socialPresets[preset].height}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
