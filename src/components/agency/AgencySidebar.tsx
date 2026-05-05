'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  BadgeDollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/agency' },
  { icon: Building2, label: 'My Listings', href: '/agency/listings' },
  { icon: Users, label: 'Leads', href: '/agency/leads' },
  { icon: Calendar, label: 'Inspections', href: '/agency/inspections' },
  { icon: BadgeDollarSign, label: 'Commissions', href: '/agency/commissions' },
  { icon: Settings, label: 'Profile', href: '/agency/profile' },
]

interface Props {
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function AgencySidebar({ isMobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (href: string) =>
    href === '/agency' ? pathname === '/agency' : pathname.startsWith(href)

  const onLogout = async () => {
    setSigningOut(true)
    await fetch('/api/agency-auth/logout', { method: 'POST' })
    router.replace('/agency/login')
    router.refresh()
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div
        className={cn(
          'flex items-center justify-between px-6 h-18 border-b border-divider flex-shrink-0',
          isCollapsed && 'px-4 justify-center',
        )}
      >
        {!isCollapsed ? (
          <Link href="/agency" className="text-h4 flex items-center gap-2">
            <span className="font-bold text-navy">PROPA</span>
            <span className="font-bold text-action">BRIDGE</span>
            <span className="text-[10px] uppercase tracking-wider bg-gold-light text-[#5d3e02] px-1.5 py-0.5 rounded font-semibold">
              Agency
            </span>
          </Link>
        ) : (
          <Link href="/agency" className="text-h4 font-bold text-action">
            P
          </Link>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-full hover:bg-beige text-subtle hover:text-navy"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <button
          onClick={onMobileClose}
          className="lg:hidden flex w-7 h-7 items-center justify-center rounded-full hover:bg-beige text-subtle"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

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
                isCollapsed && 'justify-center px-3',
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon
                size={20}
                strokeWidth={1.5}
                className={cn(
                  'flex-shrink-0',
                  active ? 'text-action' : 'group-hover:scale-105',
                )}
              />
              {!isCollapsed && (
                <span className="text-body-sm font-medium">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div
        className={cn(
          'border-t border-divider p-4 flex-shrink-0',
          isCollapsed && 'px-3 flex justify-center',
        )}
      >
        <div className={cn('flex items-center gap-3', isCollapsed && 'flex-col gap-2')}>
          <div className="w-10 h-10 rounded-avatar flex-shrink-0 bg-gold-light text-[#5d3e02] flex items-center justify-center">
            <Building2 size={18} strokeWidth={1.8} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-navy truncate">Agency</p>
              <p className="text-caption text-subtle truncate">Partner</p>
            </div>
          )}
          <button
            onClick={onLogout}
            disabled={signingOut}
            className="flex-shrink-0 text-subtle hover:text-danger disabled:opacity-50"
            title="Sign out"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white z-50 shadow-sidebar transition-transform duration-200 lg:hidden w-sidebar',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebar}
      </aside>
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-divider h-screen sticky top-0 transition-all duration-200 flex-shrink-0',
          isCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
        )}
      >
        {sidebar}
      </aside>
    </>
  )
}
