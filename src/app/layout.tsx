import '../styles/globals.css'

import { TRPCProvider } from '@/lib/trpc/Provider'

export { metadata } from './metadata'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
