'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Mail,
  Calendar,
  Flame,
  LayoutTemplate,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  AlertTriangle,
  ShieldAlert,
  Bot,
  List,
  ListChecks,
  Newspaper,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sections: Array<{
  label: string
  items: { icon: typeof LayoutDashboard; label: string; href: string }[]
}> = [
  {
    label: 'Operations',
    items: [
      { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
      { icon: Users, label: 'Users', href: '/admin/users' },
      { icon: Building2, label: 'Agencies', href: '/admin/agencies' },
      { icon: ClipboardCheck, label: 'Verifications', href: '/admin/verifications' },
      { icon: Mail, label: 'Inquiries', href: '/admin/inquiries' },
      { icon: Calendar, label: 'Inspections', href: '/admin/inspections' },
    ],
  },
  {
    label: 'AI Agent',
    items: [
      { icon: MessageSquare, label: 'Conversations', href: '/admin/conversations' },
      { icon: Flame, label: 'Leads', href: '/admin/leads' },
      { icon: ListChecks, label: 'Waitlist', href: '/admin/waitlist' },
      { icon: AlertTriangle, label: 'Promises / Escalations', href: '/admin/promises' },
      { icon: ShieldAlert, label: 'Data Quality Audit', href: '/admin/audit' },
      { icon: Bot, label: 'AI Agents', href: '/admin/ai-agents' },
      { icon: LayoutTemplate, label: 'WhatsApp Templates', href: '/admin/templates' },
    ],
  },
  {
    label: 'Listings',
    items: [
      { icon: List, label: 'All Listings', href: '/admin/listings' },
    ],
  },
  {
    label: 'Content',
    items: [
      { icon: Newspaper, label: 'Blogs', href: '/admin/blogs' },
      { icon: MapPin, label: 'Neighborhoods', href: '/admin/neighborhoods' },
    ],
  },
  {
    label: 'Account',
    items: [{ icon: Settings, label: 'Settings', href: '/admin/settings' }],
  },
]

interface Props {
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({ isMobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const onLogout = async () => {
    setSigningOut(true)
    await fetch('/api/admin-auth/logout', { method: 'POST' })
    router.replace('/admin/login')
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
          <Link href="/admin" className="text-h4 flex items-center gap-2">
            <span className="font-bold text-navy">PROPA</span>
            <span className="font-bold text-action">BRIDGE</span>
            <span className="text-[10px] uppercase tracking-wider bg-beige text-subtle px-1.5 py-0.5 rounded font-semibold">
              Admin
            </span>
          </Link>
        ) : (
          <Link href="/admin" className="text-h4 font-bold text-action">
            P
          </Link>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-full hover:bg-beige text-subtle hover:text-navy transition-all duration-200"
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

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            {!isCollapsed && (
              <p className="px-4 text-caption text-placeholder uppercase tracking-wider font-semibold mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
                        'flex-shrink-0 transition-transform duration-200',
                        active ? 'text-action' : 'group-hover:scale-105',
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-body-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          'border-t border-divider p-4 flex-shrink-0',
          isCollapsed && 'px-3 flex justify-center',
        )}
      >
        <div className={cn('flex items-center gap-3', isCollapsed && 'flex-col gap-2')}>
          <div className="w-10 h-10 rounded-avatar flex-shrink-0 bg-action-light text-action flex items-center justify-center">
            <ShieldCheck size={18} strokeWidth={1.8} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-navy truncate">Admin</p>
              <p className="text-caption text-subtle truncate">Propabridge</p>
            </div>
          )}
          <button
            onClick={onLogout}
            disabled={signingOut}
            className="flex-shrink-0 text-subtle hover:text-danger transition-all duration-200 disabled:opacity-50"
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
