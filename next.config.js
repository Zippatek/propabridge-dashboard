/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
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
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Google Maps JS API + tile servers
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Map tiles, satellite imagery, Street View, APIs
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://storage.googleapis.com https://cdn.propabridge.com",
              // Google Maps iframe / XHR
              "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://propabridge-api-gateway-480235407496.us-central1.run.app https://propabridge-adk-480235407496.us-central1.run.app",
              "frame-src 'self' https://www.google.com",
              "worker-src blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
