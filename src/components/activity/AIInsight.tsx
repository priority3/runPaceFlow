/**
 * AIInsight Component
 *
 * Displays AI-generated running analysis with loading, error states,
 * typewriter animation, and option to regenerate insights
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
  /** Enable typewriter animation for new insights */
  enableTypewriter?: boolean
}

/**
 * Custom markdown components for better styling
 */
const markdownComponents: Components = {
  // Headings
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

  // Paragraphs
  p: ({ children }) => <p className="text-label/80 my-2 leading-relaxed">{children}</p>,

  // Strong/Bold
  strong: ({ children }) => <strong className="text-label font-semibold">{children}</strong>,

  // Lists
  ul: ({ children }) => <ul className="text-label/80 my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => (
    <ol className="text-label/80 my-2 ml-4 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-label/80 pl-1">{children}</li>,

  // Tables - custom styled
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

  // Code blocks
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

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-purple/30 bg-purple/5 my-3 border-l-4 py-2 pl-4 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="my-4 border-white/10" />,
}

export function AIInsight({ activityId, className, enableTypewriter = true }: AIInsightProps) {
  const utils = trpc.useUtils()
  // Track if this is a fresh generation (for typewriter effect)
  const [isNewGeneration, setIsNewGeneration] = React.useState(false)
  const [typewriterComplete, setTypewriterComplete] = React.useState(false)
  const [displayedContent, setDisplayedContent] = React.useState('')
  const typewriterRef = React.useRef<NodeJS.Timeout | null>(null)

  const {
    data: insight,
    isLoading,
    error,
    isFetching,
  } = trpc.insights.getForActivity.useQuery(
    { activityId },
    {
      staleTime: Infinity, // Insights are cached in DB, no need to refetch
      retry: 1,
    },
  )

  const regenerateMutation = trpc.insights.regenerate.useMutation({
    onMutate: () => {
      setIsNewGeneration(true)
      setTypewriterComplete(false)
      setDisplayedContent('')
    },
    onSuccess: () => {
      utils.insights.getForActivity.invalidate({ activityId })
    },
  })

  // Typewriter effect for new generations
  React.useEffect(() => {
    if (!insight?.content || !enableTypewriter || !isNewGeneration) {
      if (insight?.content) {
        setDisplayedContent(insight.content)
        setTypewriterComplete(true)
      }
      return
    }

    const content = insight.content
    let currentIndex = 0
    const speed = 20 // characters per frame
    const frameDelay = 16 // ~60fps

    // Clear any existing animation
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current)
    }

    typewriterRef.current = setInterval(() => {
      currentIndex += speed

      // Reason: Skip to end of current word/line for smoother reading
      while (
        currentIndex < content.length &&
        content[currentIndex] !== ' ' &&
        content[currentIndex] !== '\n'
      ) {
        currentIndex++
      }

      if (currentIndex >= content.length) {
        setDisplayedContent(content)
        setTypewriterComplete(true)
        setIsNewGeneration(false)
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current)
        }
      } else {
        setDisplayedContent(content.slice(0, currentIndex))
      }
    }, frameDelay)

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current)
      }
    }
  }, [insight?.content, enableTypewriter, isNewGeneration])

  const handleRegenerate = () => {
    regenerateMutation.mutate({ activityId })
  }

  const isRegenerating = regenerateMutation.isPending

  // Loading skeleton
  if (isLoading) {
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

  // Error state
  if (error) {
    const isApiKeyMissing = error.message?.includes('ANTHROPIC_API_KEY')

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
              ? '未配置 API 密钥，请在 .env.local 中设置 ANTHROPIC_API_KEY'
              : '生成分析时出错'}
          </p>
          {!isApiKeyMissing && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="text-purple hover:text-purple/80 mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
              重试
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!insight) return null

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
            {insight.cached && (
              <span className="bg-label/5 text-label/40 rounded-full px-2 py-0.5 text-xs">
                已缓存
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating || isFetching}
          className="text-label/40 hover:text-label/60 hover:bg-label/5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all disabled:opacity-50"
          title="重新生成"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
          <span className="hidden sm:inline">重新生成</span>
        </button>
      </div>

      {/* Content */}
      <div className={cn('ai-insight-content', isRegenerating && 'opacity-50')}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {displayedContent || insight.content}
        </ReactMarkdown>
        {/* Typewriter cursor */}
        {!typewriterComplete && isNewGeneration && (
          <motion.span
            className="bg-purple ml-1 inline-block h-4 w-[2px] align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-label/30 mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
        <span>由 Claude AI 生成</span>
        <span>{new Date(insight.generatedAt).toLocaleDateString('zh-CN')}</span>
      </div>
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
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
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
