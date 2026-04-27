'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'

const navItems = [
  { icon: LayoutDashboard, label: 'My Deal', href: '/dashboard' },
  { icon: Calendar, label: 'Inspections', href: '/dashboard/inspections' },
  { icon: FileText, label: 'Documents', href: '/dashboard/documents' },
  { icon: ShieldCheck, label: 'Verification', href: '/dashboard/verification' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface DashboardSidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

/**
 * DashboardSidebar — Navigation sidebar
 * FOUNDATION.md Section 7.1
 * - Full 240px on desktop (lg:)
 * - Icon-only 72px on tablet (md:)
 * - Drawer on mobile
 */
export function DashboardSidebar({ isMobileOpen, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'
  const userEmail = session?.user?.email || ''
  const userImage = session?.user?.image || '/images/avatar-default.jpg'

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center justify-between px-6 h-18 border-b border-divider flex-shrink-0',
        isCollapsed && 'px-4 justify-center'
      )}>
        {!isCollapsed ? (
          <Link href="/dashboard" className="text-h4 group">
            <span className="font-bold text-navy">PROPA</span>
            <span className="font-bold text-action">BRIDGE</span>
          </Link>
        ) : (
          <Link href="/dashboard" className="text-h4 font-bold text-action">
            P
          </Link>
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-full hover:bg-beige text-subtle hover:text-navy transition-all duration-200"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden flex w-7 h-7 items-center justify-center rounded-full hover:bg-beige text-subtle"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 transition-all duration-200 relative group',
                active
                  ? 'rounded-r-lg bg-beige border-l-[3px] border-action text-navy'
                  : 'rounded-lg text-subtle hover:bg-beige hover:text-navy',
                isCollapsed && 'justify-center px-3'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                size={20}
                strokeWidth={1.5}
                className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  active ? 'text-action' : 'group-hover:scale-105'
                )}
              />
              {!isCollapsed && (
                <span className="text-body-sm font-medium">{item.label}</span>
              )}
              {/* Active indicator dot for collapsed state */}
              {isCollapsed && active && (
                <span className="absolute -right-0.5 w-1.5 h-1.5 rounded-full bg-action" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* CTA — Continue on WhatsApp (Propa lives there, not in-app) */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348000000000'}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMobileClose}
          >
            <button className="w-full bg-[#25D366] text-white px-5 py-2.5 rounded-button text-nav font-semibold flex items-center justify-center gap-2 hover:bg-[#1da851] transition-all duration-200 group shadow-sm hover:shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607z"/>
              </svg>
              CONTINUE ON WHATSAPP <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </a>
        </div>
      )}

      {/* User card */}
      <div className={cn(
        'border-t border-divider p-4 flex-shrink-0',
        isCollapsed && 'px-3 flex justify-center'
      )}>
        <div className={cn('flex items-center gap-3', isCollapsed && 'flex-col gap-2')}>
          <div className="w-10 h-10 rounded-avatar overflow-hidden flex-shrink-0 bg-beige ring-2 ring-beige/50">
            <Image
              src={userImage}
              alt={userName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-navy truncate">
                {userName}
              </p>
              <p className="text-caption text-subtle truncate">
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'flex-shrink-0 text-subtle hover:text-danger transition-all duration-200 hover:scale-105',
              isCollapsed && 'mt-1'
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white z-50 shadow-sidebar transition-transform duration-200 lg:hidden',
          'w-sidebar',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-divider h-screen sticky top-0 transition-all duration-200 flex-shrink-0',
          isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
