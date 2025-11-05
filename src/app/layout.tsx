import '../styles/globals.css'

import type { Metadata } from 'next'

import { TRPCProvider } from '@/lib/trpc/Provider'

export const metadata: Metadata = {
  title: 'RunPaceFlow',
  description: '现代化的跑步记录与分析平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
