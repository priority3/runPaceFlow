/**
 * Canvas Export Utilities
 *
 * Functions for exporting canvas content to various formats
 */

/**
 * Social media size presets
 */
export const socialPresets = {
  instagram: { width: 1080, height: 1080, name: 'Instagram' },
  instagramStory: { width: 1080, height: 1920, name: 'Instagram Story' },
  twitter: { width: 1200, height: 675, name: 'Twitter' },
  strava: { width: 1200, height: 630, name: 'Strava' },
  facebook: { width: 1200, height: 630, name: 'Facebook' },
  wallpaper: { width: 1920, height: 1080, name: 'Wallpaper' },
  square: { width: 2048, height: 2048, name: 'Square HD' },
} as const

export type SocialPreset = keyof typeof socialPresets

/**
 * Export format options
 */
export type ExportFormat = 'png' | 'jpeg' | 'webp'

/**
 * Export options
 */
export interface ExportOptions {
  format?: ExportFormat
  quality?: number // 0-1 for jpeg/webp
  scale?: number // Scale factor for higher resolution
  backgroundColor?: string
}

/**
 * Export canvas to blob
 * @param canvas Canvas element
 * @param options Export options
 * @returns Promise resolving to Blob
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: ExportOptions = {},
): Promise<Blob> {
  const { format = 'png', quality = 0.92 } = options

  return new Promise((resolve, reject) => {
    const mimeType = `image/${format}`
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Export canvas to data URL
 * @param canvas Canvas element
 * @param options Export options
 * @returns Data URL string
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, options: ExportOptions = {}): string {
  const { format = 'png', quality = 0.92 } = options
  const mimeType = `image/${format}`
  return canvas.toDataURL(mimeType, quality)
}

/**
 * Download canvas as image file
 * @param canvas Canvas element
 * @param filename Filename without extension
 * @param options Export options
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  options: ExportOptions = {},
): Promise<void> {
  const { format = 'png' } = options
  const blob = await canvasToBlob(canvas, options)
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.${format}`
  document.body.append(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

/**
 * Create a scaled canvas for export
 * @param sourceCanvas Source canvas
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @param backgroundColor Optional background color
 * @returns New canvas at target size
 */
export function createScaledCanvas(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  backgroundColor?: string,
): HTMLCanvasElement {
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = targetWidth
  exportCanvas.height = targetHeight

  const ctx = exportCanvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Fill background if specified
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  // Calculate scaling to fit while maintaining aspect ratio
  const sourceAspect = sourceCanvas.width / sourceCanvas.height
  const targetAspect = targetWidth / targetHeight

  let drawWidth: number
  let drawHeight: number
  let offsetX: number
  let offsetY: number

  if (sourceAspect > targetAspect) {
    // Source is wider - fit to width
    drawWidth = targetWidth
    drawHeight = targetWidth / sourceAspect
    offsetX = 0
    offsetY = (targetHeight - drawHeight) / 2
  } else {
    // Source is taller - fit to height
    drawHeight = targetHeight
    drawWidth = targetHeight * sourceAspect
    offsetX = (targetWidth - drawWidth) / 2
    offsetY = 0
  }

  ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight)

  return exportCanvas
}

/**
 * Export canvas with social media preset
 * @param canvas Source canvas
 * @param preset Social media preset name
 * @param filename Filename without extension
 * @param options Additional export options
 */
export async function exportForSocial(
  canvas: HTMLCanvasElement,
  preset: SocialPreset,
  filename: string,
  options: ExportOptions = {},
): Promise<void> {
  const { width, height } = socialPresets[preset]
  const backgroundColor = options.backgroundColor || '#000000'

  const scaledCanvas = createScaledCanvas(canvas, width, height, backgroundColor)
  await downloadCanvas(scaledCanvas, `${filename}_${preset}`, options)
}

/**
 * Copy canvas to clipboard
 * @param canvas Canvas element
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await canvasToBlob(canvas, { format: 'png' })

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
  } catch {
    throw new Error('Failed to copy to clipboard. This feature may not be supported.')
  }
}

/**
 * Share canvas using Web Share API
 * @param canvas Canvas element
 * @param title Share title
 * @param text Share text
 */
export async function shareCanvas(
  canvas: HTMLCanvasElement,
  title: string,
  text: string,
): Promise<void> {
  if (!navigator.share) {
    throw new Error('Web Share API is not supported')
  }

  const blob = await canvasToBlob(canvas, { format: 'png' })
  const file = new File([blob], `${title}.png`, { type: 'image/png' })

  await navigator.share({
    title,
    text,
    files: [file],
  })
}
