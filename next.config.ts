import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  experimental: {
    // Optimize tree-shaking for common packages
    // Reason: These packages export many modules, but we only use a subset
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
    ],
  },
}

export default nextConfig
