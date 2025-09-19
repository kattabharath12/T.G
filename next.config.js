/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Skip static analysis during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Skip page data collection for API routes during build
  trailingSlash: false,
  output: 'standalone',
}

module.exports = nextConfig
