/**
 * MapErrorBoundary
 *
 * Catches WebGL/MapLibre initialization errors to prevent
 * the entire page from crashing. Shows a graceful fallback UI.
 */

'use client'

import { AlertTriangle, MapPin } from 'lucide-react'
import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

interface Props {
  children: ReactNode
  /** Optional fallback to render instead of the default error UI */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string | null
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Reason: Log to console for debugging - WebGL/MapLibre errors
    // are environment-specific and hard to reproduce
    console.error('[MapErrorBoundary] Map failed to load:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-gray-100 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="text-label text-sm font-medium">地图加载失败</p>
            <p className="text-label/50 mt-1 max-w-xs text-xs">
              {this.state.errorMessage?.includes('WebGL')
                ? '浏览器不支持 WebGL，无法渲染地图'
                : '地图组件初始化出错，其他数据仍可正常查看'}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>路线数据可在分段数据中查看</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
