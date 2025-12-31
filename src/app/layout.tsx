import '../styles/globals.css'

import { PageTransitionProvider } from '@/lib/animation'
import { TRPCProvider } from '@/lib/trpc/Provider'

export { metadata } from './metadata'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <TRPCProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
