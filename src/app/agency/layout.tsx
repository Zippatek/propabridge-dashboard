'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AgencySidebar } from '@/components/agency/AgencySidebar'
import { AgencyTopbar } from '@/components/agency/AgencyTopbar'

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  if (pathname === '/agency/login') return <>{children}</>

  return (
    <div className="flex min-h-screen bg-beige">
      <AgencySidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AgencyTopbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-dashboard mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
