/**
 * AI Prompt Builder
 *
 * Constructs structured prompts for Claude to analyze running activities
 */

import { formatDistance, formatDuration, formatPace } from '@/lib/pace/calculator'

import type { ActivityInsightInput, PaceAnalysis, StructuredAnalysis } from './types'

/**
 * Analyze pace data from splits
 */
function analyzePace(input: ActivityInsightInput): PaceAnalysis {
  const { activity, splits } = input
  const paces = splits.map((s) => s.pace).filter((p): p is number => p !== null)

  if (paces.length === 0) {
    return {
      averagePace: activity.averagePace,
      bestPace: activity.bestPace,
      worstPace: null,
      paceVariation: 0,
      splitTrend: 'even',
      firstHalfPace: null,
      secondHalfPace: null,
    }
  }

  const worstPace = Math.max(...paces)
  const mean = paces.reduce((sum, p) => sum + p, 0) / paces.length
  const variance = paces.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / paces.length
  const paceVariation = Math.sqrt(variance)

  // Calculate first/second half paces
  const halfIndex = Math.floor(paces.length / 2)
  const firstHalfPaces = paces.slice(0, halfIndex)
  const secondHalfPaces = paces.slice(halfIndex)

  const firstHalfPace =
    firstHalfPaces.length > 0
      ? firstHalfPaces.reduce((sum, p) => sum + p, 0) / firstHalfPaces.length
      : null

  const secondHalfPace =
    secondHalfPaces.length > 0
      ? secondHalfPaces.reduce((sum, p) => sum + p, 0) / secondHalfPaces.length
      : null

  // Determine split trend
  let splitTrend: 'negative' | 'positive' | 'even' = 'even'
  if (firstHalfPace && secondHalfPace) {
    const diff = secondHalfPace - firstHalfPace
    // Reason: >15 seconds difference is significant for split trend classification
    if (diff < -15) {
      splitTrend = 'negative' // faster in second half
    } else if (diff > 15) {
      splitTrend = 'positive' // slower in second half
    }
  }

  return {
    averagePace: activity.averagePace,
    bestPace: activity.bestPace,
    worstPace,
    paceVariation,
    splitTrend,
    firstHalfPace,
    secondHalfPace,
  }
}

/**
 * Build structured analysis from activity data
 */
export function buildStructuredAnalysis(input: ActivityInsightInput): StructuredAnalysis {
  const { activity, splits } = input

  return {
    distance: activity.distance,
    duration: activity.duration,
    pace: analyzePace(input),
    heartRate: {
      averageHR: activity.averageHeartRate,
      maxHR: activity.maxHeartRate,
      hasData: activity.averageHeartRate !== null,
    },
    elevation: {
      totalGain: activity.elevationGain,
      hasData: activity.elevationGain !== null && activity.elevationGain > 0,
    },
    splitsCount: splits.length,
  }
}

/**
 * Format splits data for prompt
 */
function formatSplitsForPrompt(input: ActivityInsightInput): string {
  const { splits } = input
  if (splits.length === 0) return '无分段数据'

  return splits
    .map((s) => {
      const paceStr = s.pace ? formatPace(s.pace) : '-'
      const hrStr = s.averageHeartRate ? `${s.averageHeartRate}bpm` : ''
      return `第${s.kilometer}公里: ${paceStr}/km${hrStr ? ` (${hrStr})` : ''}`
    })
    .join('\n')
}

/**
 * Build the system prompt for Claude
 */
export function buildSystemPrompt(): string {
  return `你是一位专业的跑步教练和数据分析师。你的任务是分析跑步活动数据，提供有价值的洞察和建议。

请用中文回复，保持专业但友好的语气。回复应该简洁有力，重点突出。

## 输出格式要求
- 使用 markdown 格式
- 用 **粗体** 强调关键数据和结论
- 适当使用表情符号增加可读性
- **禁止使用 markdown 表格**，改用列表或分段描述
- 每个段落保持简短（2-3句话）
- 回复长度控制在 200-350 字

## 分析结构
1. **整体评价**（1-2句总结本次跑步表现）
2. **配速分析**（分析配速变化规律，指出亮点和问题）
3. **训练建议**（给出 1-2 条具体可执行的建议）

## 分析要点
- 配速模式和稳定性
- 分段趋势（正分割/负分割/均匀）
- 心率表现（如有数据）
- 针对性的改进方向`
}

/**
 * Build the user prompt with activity data
 */
export function buildUserPrompt(input: ActivityInsightInput): string {
  const { activity } = input
  const analysis = buildStructuredAnalysis(input)

  const distanceStr = formatDistance(analysis.distance)
  const durationStr = formatDuration(analysis.duration)
  const avgPaceStr = analysis.pace.averagePace ? formatPace(analysis.pace.averagePace) : '-'
  const bestPaceStr = analysis.pace.bestPace ? formatPace(analysis.pace.bestPace) : '-'

  let prompt = `请分析以下跑步活动数据：

## 基本信息
- 距离：${distanceStr}
- 用时：${durationStr}
- 平均配速：${avgPaceStr}/km
- 最佳配速：${bestPaceStr}/km
- 活动类型：${activity.type}
`

  // Add pace analysis
  if (analysis.pace.firstHalfPace && analysis.pace.secondHalfPace) {
    const firstHalfStr = formatPace(analysis.pace.firstHalfPace)
    const secondHalfStr = formatPace(analysis.pace.secondHalfPace)
    const trendLabel =
      analysis.pace.splitTrend === 'negative'
        ? '负分割（后程加速）'
        : analysis.pace.splitTrend === 'positive'
          ? '正分割（后程减速）'
          : '均匀配速'

    prompt += `
## 配速分析
- 前半程平均：${firstHalfStr}/km
- 后半程平均：${secondHalfStr}/km
- 配速趋势：${trendLabel}
- 配速波动：±${Math.round(analysis.pace.paceVariation)}秒
`
  }

  // Add heart rate if available
  if (analysis.heartRate.hasData) {
    prompt += `
## 心率数据
- 平均心率：${analysis.heartRate.averageHR} bpm
- 最大心率：${analysis.heartRate.maxHR || '-'} bpm
`
  }

  // Add elevation if available
  if (analysis.elevation.hasData) {
    prompt += `
## 海拔数据
- 累计爬升：${Math.round(analysis.elevation.totalGain!)}米
`
  }

  // Add splits data
  prompt += `
## 分段配速
${formatSplitsForPrompt(input)}
`

  prompt += `
请根据以上数据，提供：
1. 📊 **配速分析**：分析配速变化规律和稳定性
2. 💪 **训练建议**：基于本次数据给出 1-2 条具体可行的建议`

  return prompt
}
