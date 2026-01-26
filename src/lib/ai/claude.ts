/**
 * Claude AI Client
 *
 * Handles communication with Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk'

import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { ActivityInsightInput } from './types'
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

/**
 * Generate activity insight using Claude
 *
 * @param input Activity data with splits
 * @returns Generated insight text in Chinese
 */
export async function generateActivityInsight(input: ActivityInsightInput): Promise<string> {
  const client = getClaudeClient()

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(input)

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

  // Extract text content from response
  const textContent = response.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response')
  }

  return textContent.text
}

/**
 * Get the model name for storage
 */
export function getModelName(): string {
  return CLAUDE_MODEL
}
