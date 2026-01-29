/**
 * Claude AI Client
 *
 * Handles communication with Anthropic Claude API
 */

import { resolve } from 'path'

import { config } from 'dotenv'
import Anthropic from '@anthropic-ai/sdk'

// Reason: Next.js server components may not auto-load .env.local in all contexts
config({ path: resolve(process.cwd(), '.env.local'), override: true })

import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { ActivityInsightInput } from './types'
import { CLAUDE_MODEL } from './types'
import { fetchWithCloudflareBypass } from './cloudflare-bypass'

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
      // Use custom fetch with Cloudflare bypass
      fetch: baseURL ? fetchWithCloudflareBypass : undefined,
      // Add timeout to prevent hanging requests
      timeout: 60000, // 60 seconds
      // Add default headers to mimic Claude Code CLI
      defaultHeaders: {
        'anthropic-version': '2023-06-01',
        'user-agent': 'anthropic-sdk-typescript/0.20.0',
      },
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
      throw new Error(`Invalid API response structure: ${JSON.stringify(response).slice(0, 200)}`)
    }

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    return textContent.text
  } catch (error) {
    // Log detailed error info for debugging
    console.error('[Claude API Error]', {
      model: CLAUDE_MODEL,
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      apiKeyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) + '...',
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'default (https://api.anthropic.com)',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      error: error instanceof Error ? error.message : String(error),
    })

    // Detect AWS WAF CAPTCHA response
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('<!DOCTYPE html>') ||
      errorMessage.includes('captcha') ||
      errorMessage.includes('challenge')
    ) {
      throw new Error(
        'Claude API blocked by AWS WAF verification. This usually happens when: ' +
          '1) Using a proxy that is flagged, ' +
          '2) IP address is marked as suspicious, ' +
          '3) Request rate is too high. ' +
          'Try: changing proxy, using VPN, or waiting before retrying.',
      )
    }

    // Re-throw with more context for debugging
    if (error instanceof Error) {
      throw new Error(`Claude API error: ${error.message}`)
    }
    throw new Error(`Claude API error: ${String(error)}`)
  }
}

/**
 * Get the model name for storage
 */
export function getModelName(): string {
  return CLAUDE_MODEL
}
