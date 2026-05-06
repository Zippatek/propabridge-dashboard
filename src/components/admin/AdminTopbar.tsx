'use client'

import { usePathname } from 'next/navigation'
import { Menu, RefreshCw } from 'lucide-react'

const titles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/agencies': 'Agencies',
  '/admin/listings': 'Listings',
  '/admin/inquiries': 'Inquiries',
  '/admin/inspections': 'Inspections',
  '/admin/conversations': 'Conversations',
  '/admin/leads': 'Leads',
  '/admin/verifications': 'Verifications',
  '/admin/promises': 'AI Promises & Escalations',
  '/admin/ai-agents': 'AI Agents',
  '/admin/templates': 'WhatsApp Templates',
  '/admin/settings': 'Settings',
}

interface Props {
  onMenuToggle: () => void
}

export function AdminTopbar({ onMenuToggle }: Props) {
  const pathname = usePathname()
  const matchKey = Object.keys(titles)
    .filter((k) => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]
  const pageTitle = titles[matchKey] || 'Admin'

  return (
    <header className="h-18 bg-white/90 backdrop-blur-md border-b border-divider flex items-center px-6 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-button hover:bg-beige text-navy"
        aria-label="Toggle menu"
      >
        <Menu size={22} strokeWidth={1.5} />
      </button>

      <h1 className="text-h4 text-navy font-semibold">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-body-sm text-subtle hover:text-navy bg-beige hover:bg-beige-dark px-3 py-2 rounded-button transition-all duration-150"
          title="Refresh"
        >
          <RefreshCw size={14} strokeWidth={1.8} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-badge bg-verified-light text-verified text-caption font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-verified animate-pulse-dot" />
          API Online
        </div>
      </div>
    </header>
  )
}
