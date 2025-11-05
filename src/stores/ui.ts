/**
 * UI State Atoms
 *
 * Global UI state management using Jotai
 */

import { atom } from 'jotai'

/**
 * Currently selected activity ID
 */
export const selectedActivityIdAtom = atom<string | null>(null)

/**
 * Activity list view mode: 'grid' or 'list'
 */
export const viewModeAtom = atom<'grid' | 'list'>('list')

/**
 * Loading state for global operations
 */
export const isLoadingAtom = atom(false)

/**
 * Error message to display
 */
export const errorMessageAtom = atom<string | null>(null)

/**
 * Whether the mobile sidebar is open
 */
export const isSidebarOpenAtom = atom(false)
