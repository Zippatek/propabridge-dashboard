/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/propabridge-production-bucket/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.propabridge.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
