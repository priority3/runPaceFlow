/**
 * AIInsight Component
 *
 * Displays AI-generated running analysis with real SSE streaming,
 * loading/error states, and option to regenerate insights.
 */

'use client'

import { motion } from 'framer-motion'
import { RefreshCw, Sparkles } from 'lucide-react'
import * as React from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Skeleton } from '@/components/ui/skeleton'
import { springs } from '@/lib/animation'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'

interface AIInsightProps {
  activityId: string
  className?: string
}

// ─── Markdown Components ────────────────────────────────────────────────────

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-label mt-6 mb-3 flex items-center gap-2 text-lg font-semibold first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-label mt-5 mb-2 flex items-center gap-2 text-base font-semibold first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-label/90 mt-4 mb-2 text-sm font-medium first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="text-label/80 my-2 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="text-label font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="text-label/80 my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => (
    <ol className="text-label/80 my-2 ml-4 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-label/80 pl-1">{children}</li>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-white/30 dark:bg-black/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/10 bg-white/40 dark:bg-black/20">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-white/20 dark:hover:bg-white/5">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="text-label/70 px-3 py-2 text-left text-xs font-medium tracking-wider uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="text-label/80 px-3 py-2 whitespace-nowrap">{children}</td>,
  code: ({ children, className }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="rounded bg-white/30 px-1.5 py-0.5 text-sm dark:bg-black/20">
          {children}
        </code>
      )
    }
    return (
      <code className="block overflow-x-auto rounded-lg bg-white/30 p-3 text-sm dark:bg-black/20">
        {children}
      </code>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="border-purple/30 bg-purple/5 my-3 border-l-4 py-2 pl-4 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getProviderLabel(model: string): string {
  if (model.startsWith('claude')) return 'Claude AI'
  if (model.startsWith('deepseek')) return 'DeepSeek'
  if (model.startsWith('qwen')) return '通义千问'
  if (model.startsWith('gpt')) return 'OpenAI'
  return 'AI'
}

// ─── SSE Streaming Hook ────────────────────────────────────────────────────

type StreamStatus = 'idle' | 'streaming' | 'done' | 'error'

interface StreamState {
  status: StreamStatus
  content: string
  model: string | null
  provider: string | null
  error: string | null
}

function useInsightStream(activityId: string) {
  const [state, setState] = React.useState<StreamState>({
    status: 'idle',
    content: '',
    model: null,
    provider: null,
    error: null,
  })

  // Reason: AbortController ref lets us cancel an in-flight stream on unmount or re-trigger
  const abortRef = React.useRef<AbortController | null>(null)

  const startStream = React.useCallback(
    async (regenerate = false) => {
      // Cancel any existing stream
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState({
        status: 'streaming',
        content: '',
        model: null,
        provider: null,
        error: null,
      })

      try {
        const response = await fetch('/api/insights/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activityId, regenerate }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          throw new Error(errBody.error || `HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Reason: SSE events are delimited by double newlines; process all complete events
          const events = buffer.split('\n\n')
          // Keep the last (potentially incomplete) chunk in the buffer
          buffer = events.pop() || ''

          for (const event of events) {
            const line = event.trim()
            if (!line.startsWith('data: ')) continue

            const payload = line.slice(6) // strip "data: "

            // Handle completion event
            if (payload.startsWith('[DONE]')) {
              try {
                const meta = JSON.parse(payload.slice(7))
                setState((prev) => ({
                  ...prev,
                  status: 'done',
                  model: meta.model || prev.model,
                  provider: meta.provider || prev.provider,
                }))
              } catch {
                setState((prev) => ({ ...prev, status: 'done' }))
              }
              return
            }

            // Handle error event
            if (payload.startsWith('[ERROR]')) {
              const errData = JSON.parse(payload.slice(8))
              setState((prev) => ({
                ...prev,
                status: 'error',
                error: errData.error || 'Stream error',
              }))
              return
            }

            // Handle text delta
            try {
              const { text } = JSON.parse(payload) as { text: string }
              setState((prev) => ({
                ...prev,
                content: prev.content + text,
              }))
            } catch {
              // Ignore malformed events
            }
          }
        }

        // Reason: If we exit the read loop without [DONE], mark as done anyway
        setState((prev) => (prev.status === 'streaming' ? { ...prev, status: 'done' } : prev))
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        }))
      }
    },
    [activityId],
  )

  // Cleanup on unmount
  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return { ...state, startStream }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AIInsight({ activityId, className }: AIInsightProps) {
  const utils = trpc.useUtils()

  const { data: insight, isLoading } = trpc.insights.getForActivity.useQuery(
    { activityId },
    { staleTime: Infinity, retry: 1 },
  )

  const {
    status: streamStatus,
    content: streamContent,
    model: streamModel,
    error: streamError,
    startStream,
  } = useInsightStream(activityId)
  const streamTriggered = React.useRef(false)

  // Reason: Auto-trigger stream when cache misses (insight === null after loading)
  React.useEffect(() => {
    if (!isLoading && insight === null && !streamTriggered.current) {
      streamTriggered.current = true
      startStream(false)
    }
  }, [isLoading, insight, startStream])

  // Invalidate tRPC cache after stream finishes so next mount uses cached data
  React.useEffect(() => {
    if (streamStatus === 'done') {
      utils.insights.getForActivity.invalidate({ activityId })
    }
  }, [streamStatus, utils.insights.getForActivity, activityId])

  const handleRegenerate = () => {
    streamTriggered.current = true
    startStream(true)
  }

  const isStreaming = streamStatus === 'streaming'
  const showStreamContent = streamStatus === 'streaming' || streamStatus === 'done'

  // Determine what content and model to display
  const displayContent = showStreamContent ? streamContent : insight?.content || ''
  const displayModel = showStreamContent ? streamModel : insight?.model || null

  // Loading skeleton
  if (isLoading) {
    return <AIInsightSkeleton className={className} />
  }

  // Error from stream
  if (streamStatus === 'error') {
    const isApiKeyMissing =
      streamError?.includes('ANTHROPIC_API_KEY') ||
      streamError?.includes('OPENAI_API_KEY') ||
      streamError?.includes('未配置任何 AI 服务')

    return (
      <div
        className={cn(
          'rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
          className,
        )}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="bg-label/5 flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="text-label/30 h-4 w-4" />
          </div>
          <span className="text-label font-medium">AI 跑步分析</span>
        </div>
        <div className="py-6 text-center">
          <p className="text-label/50 text-sm">
            {isApiKeyMissing
              ? '未配置 AI 服务，请在 .env.local 中设置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY'
              : '生成分析时出错'}
          </p>
          {!isApiKeyMissing && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="text-purple hover:text-purple/80 mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重试
            </button>
          )}
        </div>
      </div>
    )
  }

  // Still waiting for first content (stream just started, no data yet)
  if (!displayContent && streamStatus !== 'done') {
    return <AIInsightSkeleton className={className} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className={cn(
        'rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-purple/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="text-purple h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label font-medium">AI 跑步分析</span>
            {insight?.cached && streamStatus === 'idle' && (
              <span className="bg-label/5 text-label/40 rounded-full px-2 py-0.5 text-xs">
                已缓存
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isStreaming}
          className="text-label/40 hover:text-label/60 hover:bg-label/5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all disabled:opacity-50"
          title="重新生成"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isStreaming && 'animate-spin')} />
          <span className="hidden sm:inline">重新生成</span>
        </button>
      </div>

      {/* Content */}
      <div className="ai-insight-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {displayContent}
        </ReactMarkdown>
        {/* Blinking cursor while streaming */}
        {isStreaming && (
          <motion.span
            className="bg-purple ml-1 inline-block h-4 w-[2px] align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </div>

      {/* Footer */}
      {displayModel && streamStatus !== 'streaming' && (
        <div className="text-label/30 mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <span>由 {getProviderLabel(displayModel)} 生成</span>
          {insight?.generatedAt && (
            <span>{new Date(insight.generatedAt).toLocaleDateString('zh-CN')}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

/**
 * AIInsight skeleton for suspense boundaries
 */
export function AIInsightSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/50 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-black/20',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="bg-purple/10 flex h-8 w-8 items-center justify-center rounded-lg">
          <Sparkles className="text-purple h-4 w-4" />
        </div>
        <span className="text-label font-medium">AI 跑步分析</span>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-2">
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
