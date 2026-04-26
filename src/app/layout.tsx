import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/**
 * Inter Display — Self-hosted to avoid Google Fonts timeout.
 * Falls back to the Inter variable font available via next/font/google
 * but we use localFont for reliability in restricted network environments.
 *
 * Brand spec: Inter Display across all weights (400–800).
 */
const interDisplay = localFont({
  src: [
    {
      path: '../../public/fonts/InterDisplay-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/InterDisplay-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/InterDisplay-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/InterDisplay-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/InterDisplay-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-inter-display',
  fallback: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Propabridg',
  description:
    'Find verified homes across Nigeria with zero inspection fees. Every listing on Propabridge is physically inspected and title-verified.',
  keywords: [
    'Nigerian real estate',
    'verified properties',
    'Abuja properties',
    'Kaduna real estate',
    'zero inspection fees',
    'Propabridge',
  ],
  openGraph: {
    title: 'Propabridge',
    description:
      'Find verified homes across Nigeria with zero inspection fees.',
    siteName: 'Propabridge',
    type: 'website',
  },
}

import { CustomCursor } from '@/components/ui/CustomCursor'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={interDisplay.variable}>
      <body className={interDisplay.className}>
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
