/**
 * AI Insight Types
 *
 * Type definitions for Claude AI integration
 */

import type { Activity, Split } from '@/lib/db/schema'

/**
 * Input data for generating activity insights
 */
export interface ActivityInsightInput {
  activity: Activity
  splits: Split[]
}

/**
 * Pace analysis data extracted from activity
 */
export interface PaceAnalysis {
  averagePace: number | null // seconds per km
  bestPace: number | null // seconds per km
  worstPace: number | null // seconds per km
  paceVariation: number // standard deviation
  splitTrend: 'negative' | 'positive' | 'even' // negative = faster at end
  firstHalfPace: number | null
  secondHalfPace: number | null
}

/**
 * Heart rate analysis data (if available)
 */
export interface HeartRateAnalysis {
  averageHR: number | null
  maxHR: number | null
  hasData: boolean
}

/**
 * Elevation analysis data (if available)
 */
export interface ElevationAnalysis {
  totalGain: number | null
  hasData: boolean
}

/**
 * Structured analysis result for prompt building
 */
export interface StructuredAnalysis {
  distance: number // meters
  duration: number // seconds
  pace: PaceAnalysis
  heartRate: HeartRateAnalysis
  elevation: ElevationAnalysis
  splitsCount: number
}

/**
 * Claude model options
 * Using Sonnet 4.5 for better availability and lower cost
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250514' as const
export type ClaudeModel = typeof CLAUDE_MODEL
