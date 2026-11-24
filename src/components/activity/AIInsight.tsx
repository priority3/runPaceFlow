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

/** pr-ui 阅读形态：正文 14/1.78，标题 14，表格去竖线、表头 11px、数字等宽 */
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="pr-title text-label mt-6 mb-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="pr-title text-label mt-5 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="pr-title text-label mt-4 mb-2 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="pr-body my-2">{children}</p>,
  strong: ({ children }) => <strong className="text-label font-medium">{children}</strong>,
  ul: ({ children }) => <ul className="pr-body my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="pr-body my-2 ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="pr-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th>{children}</th>,
  td: ({ children }) => <td className="pr-num">{children}</td>,
  code: ({ children, className }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code className="rounded bg-[var(--pr-sel)] px-1.5 py-0.5 text-[13px]">{children}</code>
      )
    }
    return (
      <code className="block overflow-x-auto rounded-lg bg-[var(--pr-sel)] p-3 text-[13px]">
        {children}
      </code>
    )
  },
  blockquote: ({ children }) => (
    <blockquote className="text-secondary-label my-3 border-l border-[var(--pr-line-strong)] py-1 pl-4">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="pr-divider my-4" />,
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
      <div className={cn('premium-surface p-6', className)}>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="bg-system-fill flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="text-secondary-label h-4 w-4" />
          </div>
          <span className="text-label font-medium">AI 跑步分析</span>
        </div>
        <div className="py-6">
          <p className="pr-empty-line">这次训练还没有分析</p>
          <p className="text-secondary-label mt-2 text-[13.5px]">下次数据同步后会自动出现。</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className={cn('premium-surface p-6', className)}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <div className="bg-system-fill flex h-8 w-8 items-center justify-center rounded-lg">
          <Sparkles className="text-secondary-label h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label font-medium">AI 跑步分析</span>
          {insight.cached && <span className="pr-tag">已缓存</span>}
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
        <div className="pr-meta border-separator mt-5 flex items-center justify-between border-t pt-4">
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
    <div className={cn('premium-surface p-6', className)}>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="bg-system-fill flex h-8 w-8 items-center justify-center rounded-lg">
          <Sparkles className="text-secondary-label h-4 w-4" />
        </div>
        <span className="text-label font-medium">AI 跑步分析</span>
      </div>
      <div className="space-y-3">
        <Skeleton className="bg-tertiary-system-fill h-5 w-2/3" />
        <Skeleton className="bg-tertiary-system-fill h-4 w-full" />
        <Skeleton className="bg-tertiary-system-fill h-4 w-5/6" />
        <div className="pt-2">
          <Skeleton className="bg-tertiary-system-fill h-20 w-full rounded-lg" />
        </div>
        <Skeleton className="bg-tertiary-system-fill h-4 w-4/5" />
        <Skeleton className="bg-tertiary-system-fill h-4 w-3/4" />
      </div>
    </div>
  )
}
