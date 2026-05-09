'use client'

/**
 * Waitlist queue — leads captured with status = "waitlisted".
 *
 * Drives ADK `GET /api/admin/leads?status=waitlisted&intent=…` (proxied via
 * `/api/admin/adk/...`).  Filters the canonical leads table; there is no
 * dedicated /waitlists endpoint — this matches the legacy ADK admin tab in
 * `static/admin.html` (`showWaitlist()` flips the lead status filter).
 *
 * Tabs split the queue by intent (rent / buy / invest) — the same axes the
 * agent uses to record lead requirements via `capture_lead`.
 */

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ListChecks, MessageSquare, Phone, Mail } from 'lucide-react'
import type { AdkLead } from '@/lib/types'
import { adk } from '@/lib/client-api'
import { scoreClass, formatRelativeTime, formatNaira } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

type Tab = 'all' | 'rent' | 'buy' | 'invest'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rent', label: 'Rent' },
  { id: 'buy', label: 'Buy' },
  { id: 'invest', label: 'Invest' },
]

function budgetLabel(lead: AdkLead): string {
  if (typeof lead.budget === 'number') return formatNaira(lead.budget)
  if (lead.budget) return String(lead.budget)
  return '—'
}

export default function AdminWaitlistPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [leads, setLeads] = useState<AdkLead[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLeads(null)
    setError(null)
    const params = new URLSearchParams()
    params.set('status', 'waitlisted')
    params.set('min_score', '0') // waitlisted leads are pre-conversion; do not score-gate
    params.set('limit', '200')
    if (tab !== 'all') params.set('intent', tab)

    adk
      .get<{ items: AdkLead[] }>(`/leads?${params}`)
      .then((d) => setLeads(d.items || []))
      .catch((e) => setError((e as Error).message))
  }, [tab])

  const counts = useMemo(() => {
    if (!leads) return null
    const byIntent = { rent: 0, buy: 0, invest: 0, other: 0 }
    for (const l of leads) {
      const i = (l.intent || '').toLowerCase()
      if (i === 'rent' || i === 'buy' || i === 'invest') byIntent[i] += 1
      else byIntent.other += 1
    }
    return byIntent
  }, [leads])

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <ListChecks size={22} strokeWidth={1.8} className="text-action" />
            Waitlist
          </h1>
          <p className="text-body-sm text-subtle mt-1">
            Leads the agent could not match to a verified property — surfaced here
            so the listing-monitor agent (or a human) can reach out when stock arrives.
          </p>
        </div>
        {leads !== null && (
          <span className="inline-flex items-center gap-1.5 bg-action-light text-action text-body-sm font-semibold px-3 py-1.5 rounded-badge border border-action/20">
            {leads.length} on {tab === 'all' ? 'waitlist' : `${tab} waitlist`}
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-beige rounded-lg p-1 w-fit border border-divider">
        {TABS.map((t) => {
          const active = tab === t.id
          const count =
            t.id === 'all'
              ? leads?.length
              : counts
                ? (counts as Record<string, number>)[t.id] ?? 0
                : undefined
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-md text-body-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-subtle hover:text-navy'
              }`}
            >
              {t.label}
              {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up">
        {leads === null ? (
          <PageLoading />
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <ListChecks
              size={42}
              strokeWidth={1.2}
              className="mx-auto text-subtle mb-3"
            />
            <p className="text-body-sm text-subtle">
              {tab === 'all'
                ? 'No leads on the waitlist right now.'
                : `No ${tab}-intent leads on the waitlist right now.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Looking for</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Captured</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">
                        {lead.name || 'Anonymous'}
                      </p>
                      <p className="text-caption text-subtle flex items-center gap-2 mt-0.5">
                        {lead.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={11} strokeWidth={1.8} />
                            {lead.phone}
                          </span>
                        ) : null}
                        {lead.email ? (
                          <span className="flex items-center gap-1">
                            <Mail size={11} strokeWidth={1.8} />
                            {lead.email}
                          </span>
                        ) : null}
                        {!lead.phone && !lead.email ? '—' : null}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy capitalize">
                        {lead.intent || 'unknown'}
                        {lead.property_type ? ` · ${lead.property_type}` : ''}
                        {lead.bedrooms ? ` · ${lead.bedrooms}bd` : ''}
                      </p>
                      <p className="text-caption text-subtle">
                        {lead.location_preference || 'No location'}
                        {lead.timeline ? ` · ${lead.timeline}` : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {budgetLabel(lead)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-caption font-bold ${scoreClass(lead.score)}`}
                      >
                        {lead.score ?? 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatRelativeTime(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/conversations?id=${encodeURIComponent(
                          lead.session_id || lead.id,
                        )}`}
                        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button"
                      >
                        <MessageSquare size={12} strokeWidth={2} />
                        Open chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
