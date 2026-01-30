import '../styles/globals.css'

import { PageTransitionProvider } from '@/lib/animation'
import { ThemeProvider } from '@/lib/theme'
import { TRPCProvider } from '@/lib/trpc/Provider'

export { metadata } from './metadata'

// Script to prevent flash of wrong theme on initial load
const themeScript = `
  (function() {
    const stored = localStorage.getItem('theme');
    let theme = stored;
    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <TRPCProvider>
          <ThemeProvider>
            <PageTransitionProvider>{children}</PageTransitionProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  )
}
