/**
 * Claude AI Provider
 *
 * Handles communication with Anthropic Claude API, implementing the AIProvider interface
 */

import Anthropic from '@anthropic-ai/sdk'

import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { ActivityInsightInput, AIGenerationResult, AIProvider } from './types'
import { CLAUDE_MODEL } from './types'

// Lazy initialization to avoid issues during build
let claudeClient: Anthropic | null = null

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    const baseURL = process.env.ANTHROPIC_BASE_URL

    claudeClient = new Anthropic({
      apiKey,
      // Support custom base URL for proxy or alternative endpoints
      ...(baseURL && { baseURL }),
    })
  }
  return claudeClient
}

export const claudeProvider: AIProvider = {
  name: 'Claude',

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY
  },

  async generateInsight(input: ActivityInsightInput): Promise<AIGenerationResult> {
    const client = getClaudeClient()

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(input)

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      // Validate response structure
      if (!response || !response.content) {
        // Reason: Some proxies return different response structures
        throw new Error(`Invalid API response structure: ${JSON.stringify(response).slice(0, 200)}`)
      }

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text')
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response')
      }

      return {
        content: textContent.text,
        model: CLAUDE_MODEL,
        provider: 'claude',
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude API error: ${error.message}`)
      }
      throw new Error(`Claude API error: ${String(error)}`)
    }
  },
}
