'use client'

import { SessionProvider } from 'next-auth/react'
import { APIProvider } from '@vis.gl/react-google-maps'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        {children}
      </APIProvider>
    </SessionProvider>
  )
}
