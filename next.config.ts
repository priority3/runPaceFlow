import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
}

export default nextConfig
