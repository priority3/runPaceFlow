import type { NextRequest } from 'next/server'

import { getPublicRuntimeConfig } from '@/lib/runtime-config/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STREAM_HEADERS = {
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'Content-Type': 'text/event-stream; charset=utf-8',
  'X-Accel-Buffering': 'no',
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      let lastPayload = ''

      const enqueue = (chunk: string) => {
        if (!closed) {
          controller.enqueue(encoder.encode(chunk))
        }
      }

      const publish = async () => {
        try {
          const payload = JSON.stringify(await getPublicRuntimeConfig({ force: true }))
          if (payload !== lastPayload) {
            lastPayload = payload
            enqueue(`event: runtime-config\ndata: ${payload}\n\n`)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load runtime config'
          enqueue(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        }
      }

      void publish()
      const interval = setInterval(() => {
        void publish()
      }, 1000)
      const keepAlive = setInterval(() => {
        enqueue(': keepalive\n\n')
      }, 25000)

      const close = () => {
        if (closed) return
        closed = true
        clearInterval(interval)
        clearInterval(keepAlive)
        controller.close()
      }

      request.signal.addEventListener('abort', close, { once: true })
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}
