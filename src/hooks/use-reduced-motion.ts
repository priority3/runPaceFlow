/**
 * useReducedMotion Hook
 *
 * Detects user's animation preference and respects accessibility settings
 * Returns true if user prefers reduced motion
 */

'use client'

import { useSyncExternalStore } from 'react'

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getServerSnapshot(): boolean {
  return false
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Listen for changes
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', callback)
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(callback)
  }

  // Cleanup
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', callback)
    } else {
      mediaQuery.removeListener(callback)
    }
  }
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
