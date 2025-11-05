import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成唯一 ID
 * 使用 nanoid 生成 21 字符的 ID
 */
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 21)

export function generateId(prefix?: string): string {
  const id = nanoid()
  return prefix ? `${prefix}_${id}` : id
}

/**
 * 睡眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | number): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 格式化时间
 */
export function formatTime(date: Date | number): string {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date | number): string {
  return `${formatDate(date)} ${formatTime(date)}`
}
