/**
 * OpenAI-Compatible AI Provider
 *
 * Supports two API formats:
 * - Chat Completions (/v1/chat/completions) — standard OpenAI, DeepSeek, Tongyi, etc.
 * - Responses API (/v1/responses) — newer OpenAI Codex-style endpoints
 *
 * Set OPENAI_API_FORMAT=responses to force Responses API format,
 * otherwise defaults to Chat Completions.
 */

import OpenAI from 'openai'

import { getRuntimeSettings } from '@/lib/runtime-config/server'

import { buildSystemPrompt, buildUserPrompt } from './prompts'
import type { ActivityInsightInput, AIGenerationResult, AIProvider, AIStreamResult } from './types'
import { OPENAI_DEFAULT_MODEL } from './types'

async function getOpenAIConfig() {
  const settings = await getRuntimeSettings({ force: true })
  const apiKey = settings.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  return {
    apiKey,
    baseURL: settings.OPENAI_BASE_URL,
    model: settings.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
    useResponsesAPI: settings.OPENAI_API_FORMAT === 'responses',
  }
}

function getOpenAIClient(config: Awaited<ReturnType<typeof getOpenAIConfig>>): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    // Reason: Custom baseURL enables third-party services like DeepSeek, Tongyi, etc.
    ...(config.baseURL && { baseURL: config.baseURL }),
  })
}

/**
 * Generate insight using the standard Chat Completions API
 */
async function generateViaChatCompletions(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIGenerationResult> {
  const response = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  if (!response.choices || response.choices.length === 0) {
    throw new Error(
      `Invalid Chat Completions response (no choices): ${JSON.stringify(response).slice(0, 200)}`,
    )
  }

  const content = response.choices[0].message?.content
  if (!content) {
    throw new Error('No content in Chat Completions response')
  }

  return { content, model: response.model || model, provider: 'openai-compatible' }
}

/**
 * Generate insight using the newer Responses API (/v1/responses)
 * Used by OpenAI Codex-style endpoints and some third-party proxies.
 */
async function generateViaResponsesAPI(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIGenerationResult> {
  const response = await client.responses.create({
    model,
    instructions: systemPrompt,
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: userPrompt }],
      },
    ],
    store: false,
  })

  // Reason: Extract text from the Responses API output structure
  // output[].type === 'message' -> content[].type === 'output_text' -> text
  const messageOutput = response.output.find((item: { type: string }) => item.type === 'message')
  if (!messageOutput || messageOutput.type !== 'message') {
    throw new Error(
      `Invalid Responses API output (no message): ${JSON.stringify(response.output).slice(0, 200)}`,
    )
  }

  const textContent = messageOutput.content.find((c: { type: string }) => c.type === 'output_text')
  if (!textContent || textContent.type !== 'output_text') {
    throw new Error('No text content in Responses API output')
  }

  return {
    content: textContent.text,
    model: response.model || model,
    provider: 'openai-compatible',
  }
}

/**
 * Stream insight using Chat Completions API (/v1/chat/completions)
 */
async function streamViaChatCompletions(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIStreamResult> {
  const stream = await client.chat.completions.create({
    model,
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  async function* textDeltas(): AsyncIterable<string> {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        yield delta
      }
    }
  }

  return { stream: textDeltas(), model, provider: 'openai-compatible' }
}

/**
 * Stream insight using the Responses API (/v1/responses)
 * Reason: Some gateways (e.g. Sub2API) only expose the Responses API, not Chat Completions.
 */
async function streamViaResponsesAPI(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<AIStreamResult> {
  const stream = await client.responses.create({
    model,
    instructions: systemPrompt,
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: userPrompt }],
      },
    ],
    stream: true,
    store: false,
  })

  // Reason: Responses API streaming emits 'response.output_text.delta' events with { delta: string }
  async function* textDeltas(): AsyncIterable<string> {
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        yield event.delta
      }
    }
  }

  return { stream: textDeltas(), model, provider: 'openai-compatible' }
}

export const openaiProvider: AIProvider = {
  name: 'OpenAI-Compatible',

  async isAvailable(): Promise<boolean> {
    const settings = await getRuntimeSettings()
    return !!settings.OPENAI_API_KEY
  },

  async generateInsight(input: ActivityInsightInput): Promise<AIGenerationResult> {
    const config = await getOpenAIConfig()
    const client = getOpenAIClient(config)
    const { model } = config

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(input)

    try {
      if (config.useResponsesAPI) {
        return await generateViaResponsesAPI(client, model, systemPrompt, userPrompt)
      }
      return await generateViaChatCompletions(client, model, systemPrompt, userPrompt)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI-compatible API error: ${error.message}`)
      }
      throw new Error(`OpenAI-compatible API error: ${String(error)}`)
    }
  },

  async streamInsight(input: ActivityInsightInput): Promise<AIStreamResult> {
    const config = await getOpenAIConfig()
    const client = getOpenAIClient(config)
    const { model } = config

    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(input)

    try {
      if (config.useResponsesAPI) {
        return await streamViaResponsesAPI(client, model, systemPrompt, userPrompt)
      }
      return await streamViaChatCompletions(client, model, systemPrompt, userPrompt)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI-compatible API stream error: ${error.message}`)
      }
      throw new Error(`OpenAI-compatible API stream error: ${String(error)}`)
    }
  },
}
