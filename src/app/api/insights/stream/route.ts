/**
 * SSE Streaming Route for AI Insights
 *
 * POST /api/insights/stream
 * Body: { activityId: string, regenerate?: boolean }
 *
 * Returns a Server-Sent Events stream with text deltas, then caches the
 * complete result to the database when the stream finishes.
 */

import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { streamActivityInsight } from '@/lib/ai/provider'
import { db } from '@/lib/db'
import { activities, activityInsights, splits } from '@/lib/db/schema'

function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function POST(request: NextRequest) {
  let body: { activityId?: string; regenerate?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { activityId, regenerate } = body
  if (!activityId || typeof activityId !== 'string') {
    return NextResponse.json({ error: 'activityId is required' }, { status: 400 })
  }

  // Fetch activity and splits from DB
  const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1)

  if (activity.length === 0) {
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
  }

  const activitySplits = await db
    .select()
    .from(splits)
    .where(eq(splits.activityId, activityId))
    .orderBy(splits.kilometer)

  // Start the AI stream
  let streamResult: Awaited<ReturnType<typeof streamActivityInsight>>
  try {
    streamResult = await streamActivityInsight({
      activity: activity[0],
      splits: activitySplits,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { stream, model, provider } = streamResult

  // Reason: Use TransformStream to bridge the async iterable into a ReadableStream
  // that sends SSE-formatted events to the client.
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = ''

      try {
        for await (const chunk of stream) {
          fullContent += chunk
          const data = JSON.stringify({ text: chunk })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        // Send completion event with metadata
        const doneData = JSON.stringify({ model, provider })
        controller.enqueue(encoder.encode(`data: [DONE] ${doneData}\n\n`))
        controller.close()

        // Cache the complete content to DB (best-effort)
        try {
          if (regenerate) {
            await db.delete(activityInsights).where(eq(activityInsights.activityId, activityId))
          }
          await db.insert(activityInsights).values({
            id: generateInsightId(),
            activityId,
            content: fullContent,
            generatedAt: new Date(),
            model,
          })
        } catch (err) {
          console.warn('Failed to cache insight:', (err as Error).message)
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        const errData = JSON.stringify({ error: errMsg })
        controller.enqueue(encoder.encode(`data: [ERROR] ${errData}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Model': model,
      'X-Provider': provider,
    },
  })
}
