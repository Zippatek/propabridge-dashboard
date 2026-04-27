'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, Bell, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'My Deal',
  '/dashboard/inspections': 'Inspections',
  '/dashboard/documents': 'Documents',
  '/dashboard/verification': 'Verification',
  '/dashboard/settings': 'Settings',
}

interface DashboardTopbarProps {
  onMenuToggle: () => void
}

/**
 * DashboardTopbar — Top navigation bar
 * FOUNDATION.md Section 7.2
 * Height: 72px, white bg with subtle glass effect, border-bottom
 */
export function DashboardTopbar({ onMenuToggle }: DashboardTopbarProps) {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || 'Dashboard'
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'
  const userImage = session?.user?.image || '/images/avatar-default.jpg'

  return (
    <header className="h-18 bg-white/90 backdrop-blur-md border-b border-divider flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-button hover:bg-beige text-navy transition-all duration-200"
        aria-label="Toggle menu"
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      {/* Page title */}
      <h1 className="text-h4 text-navy font-semibold hidden sm:block">
        {pageTitle}
      </h1>

      {/* Search bar — center */}
      <div className="flex-1 max-w-[480px] mx-auto hidden md:block">
        <div className="relative group">
          <Search
            size={18}
            strokeWidth={1.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-placeholder group-focus-within:text-action transition-colors duration-200"
          />
          <input
            type="text"
            placeholder="Search verified properties..."
            className="w-full pl-11 pr-4 py-2.5 rounded-badge bg-beige border border-transparent text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:bg-white focus:border-action/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-button hover:bg-beige text-subtle hover:text-navy transition-all duration-200 group"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.5} className="transition-transform duration-300 group-hover:rotate-12" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-action rounded-full animate-pulse-dot ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-badge hover:bg-beige transition-all duration-200 group" aria-label="Profile menu">
          <div className="w-9 h-9 rounded-avatar overflow-hidden bg-beige flex-shrink-0 ring-2 ring-transparent group-hover:ring-action/20 transition-all duration-200">
            <Image
              src={userImage}
              alt={userName}
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="text-body-sm font-medium text-navy hidden lg:inline">
            {userName.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  )
}
