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
 * Weather analysis data (if available)
 */
export interface WeatherAnalysis {
  temperature?: number
  humidity?: number
  windSpeed?: number
  weatherCode?: number
  description?: string
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
  weather: WeatherAnalysis
  splitsCount: number
}

/**
 * Claude model options
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514' as const
export type ClaudeModel = typeof CLAUDE_MODEL

/**
 * Default model for OpenAI-compatible providers
 */
export const OPENAI_DEFAULT_MODEL = 'gpt-4o' as const

/**
 * Result from any AI provider generation
 */
export interface AIGenerationResult {
  content: string
  model: string
  provider: string
}

/**
 * Result from streaming AI generation
 */
export interface AIStreamResult {
  stream: AsyncIterable<string>
  model: string
  provider: string
}

/**
 * AI Provider interface for multi-provider fallback support
 */
export interface AIProvider {
  name: string
  isAvailable: () => boolean
  generateInsight: (input: ActivityInsightInput) => Promise<AIGenerationResult>
  streamInsight?: (input: ActivityInsightInput) => Promise<AIStreamResult>
}
