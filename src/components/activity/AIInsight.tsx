/**
 * AIInsight Component (Read-Only)
 *
 * Displays AI-generated running analysis from cache.
 * AI generation is handled by admin backend scheduler.
 */

'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
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

// ─── Component ──────────────────────────────────────────────────────────────

export function AIInsight({ activityId, className }: AIInsightProps) {
  const { data: insight, isLoading } = trpc.insights.getForActivity.useQuery(
    { activityId },
    { staleTime: Infinity, retry: 1 },
  )

  // Loading skeleton
  if (isLoading) {
    return <AIInsightSkeleton className={className} />
  }

  // No cached insight - show pending message
  if (!insight?.content) {
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
          <p className="text-label/50 text-sm">AI 分析生成中，请稍后再查看</p>
        </div>
      </div>
    )
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
      <div className="mb-5 flex items-center gap-2.5">
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

      {/* Content */}
      <div className="ai-insight-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {insight.content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      {insight.model && (
        <div className="text-label/30 mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <span>由 {getProviderLabel(insight.model)} 生成</span>
          {insight.generatedAt && (
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
        <Skeleton className="h-5 w-2/3 bg-black/5 dark:bg-white/10" />
        <Skeleton className="h-4 w-full bg-black/5 dark:bg-white/10" />
        <Skeleton className="h-4 w-5/6 bg-black/5 dark:bg-white/10" />
        <div className="pt-2">
          <Skeleton className="h-20 w-full rounded-xl bg-black/5 dark:bg-white/10" />
        </div>
        <Skeleton className="h-4 w-4/5 bg-black/5 dark:bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-black/5 dark:bg-white/10" />
      </div>
    </div>
  )
}
