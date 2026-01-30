'use client'

import { useCallback, useRef } from 'react'

import type { ExportOptions, SocialPreset } from '@/lib/art/export'
import {
  canvasToBlob,
  copyCanvasToClipboard,
  createScaledCanvas,
  downloadCanvas,
  shareCanvas,
  socialPresets,
} from '@/lib/art/export'

/**
 * Hook for canvas export functionality
 */
export function useCanvasExport() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  /**
   * Set the canvas reference
   */
  const setCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
  }, [])

  /**
   * Download canvas as image
   */
  const download = useCallback(async (filename: string, options?: ExportOptions) => {
    if (!canvasRef.current) {
      throw new Error('Canvas not initialized')
    }
    await downloadCanvas(canvasRef.current, filename, options)
  }, [])

  /**
   * Download canvas with social media preset
   */
  const downloadForSocial = useCallback(
    async (preset: SocialPreset, filename: string, options?: ExportOptions) => {
      if (!canvasRef.current) {
        throw new Error('Canvas not initialized')
      }

      const { width, height } = socialPresets[preset]
      const backgroundColor = options?.backgroundColor || '#000000'

      const scaledCanvas = createScaledCanvas(canvasRef.current, width, height, backgroundColor)
      await downloadCanvas(scaledCanvas, `${filename}_${preset}`, options)
    },
    [],
  )

  /**
   * Copy canvas to clipboard
   */
  const copyToClipboard = useCallback(async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas not initialized')
    }
    await copyCanvasToClipboard(canvasRef.current)
  }, [])

  /**
   * Share canvas using Web Share API
   */
  const share = useCallback(async (title: string, text: string) => {
    if (!canvasRef.current) {
      throw new Error('Canvas not initialized')
    }
    await shareCanvas(canvasRef.current, title, text)
  }, [])

  /**
   * Get canvas as blob
   */
  const getBlob = useCallback(async (options?: ExportOptions) => {
    if (!canvasRef.current) {
      throw new Error('Canvas not initialized')
    }
    return canvasToBlob(canvasRef.current, options)
  }, [])

  /**
   * Get canvas reference
   */
  const getCanvas = useCallback(() => canvasRef.current, [])

  return {
    setCanvas,
    download,
    downloadForSocial,
    copyToClipboard,
    share,
    getBlob,
    getCanvas,
    canvasRef,
  }
}
