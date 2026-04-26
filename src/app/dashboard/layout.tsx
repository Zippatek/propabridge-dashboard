'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardTopbar } from '@/components/layout/DashboardTopbar'

/**
 * Dashboard Layout — Shell with sidebar + topbar
 * FOUNDATION.md Section 7
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-beige">
      {/* Sidebar */}
      <DashboardSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <DashboardTopbar
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-dashboard mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
