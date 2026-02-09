// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: 'http://127.0.0.1:8000/:path*', 
      },
    ]
  },
}

module.exports = nextConfig