/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Disable static optimization for pages that use Prisma
  generateStaticParams: false,
  // Skip build-time page generation
  trailingSlash: false,
  // Disable static exports
  images: {
    unoptimized: true
  },
  // Skip static analysis during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Add webpack configuration to handle Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
      });
    }
    return config;
  },
}

module.exports = nextConfig
