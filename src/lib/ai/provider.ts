/**
 * AI Provider Orchestrator
 *
 * Manages multiple AI providers with automatic fallback.
 * Tries Claude first, then falls back to OpenAI-compatible provider on failure.
 */

import { claudeProvider } from './claude'
import { openaiProvider } from './openai'
import type { ActivityInsightInput, AIGenerationResult, AIProvider } from './types'

// Reason: Order matters — Claude is primary, OpenAI-compatible is fallback
const providers: AIProvider[] = [claudeProvider, openaiProvider]

/**
 * Generate activity insight using available AI providers with fallback.
 *
 * Tries each available provider in order. If the primary provider fails
 * (rate limit, network error, etc.), automatically falls back to the next.
 */
export async function generateActivityInsight(
  input: ActivityInsightInput,
): Promise<AIGenerationResult> {
  const availableProviders = providers.filter((p) => p.isAvailable())

  if (availableProviders.length === 0) {
    throw new Error(
      '未配置任何 AI 服务，请在 .env.local 中设置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY',
    )
  }

  let lastError: Error | null = null

  for (const provider of availableProviders) {
    try {
      return await provider.generateInsight(input)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // Reason: Log and continue to next provider for transparent fallback
      console.warn(`[AI] ${provider.name} failed, trying next provider...`, lastError.message)
    }
  }

  // All providers failed — throw the last error
  throw lastError!
}
