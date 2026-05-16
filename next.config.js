/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.propabridge.com' },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/propabridge-listings-us/**',
      },
    ],
  },
}

module.exports = nextConfig
