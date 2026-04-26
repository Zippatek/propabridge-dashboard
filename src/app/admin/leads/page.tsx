'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, ChevronDown } from 'lucide-react'
import type { AdkLead } from '@/lib/types'
import { adk } from '@/lib/client-api'
import { scoreClass, statusClass, formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

const intents = ['all', 'rent', 'buy', 'invest']

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdkLead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intent, setIntent] = useState<string>('all')
  const [minScore, setMinScore] = useState<number>(0)

  useEffect(() => {
    setLeads(null)
    setError(null)
    const params = new URLSearchParams()
    if (intent !== 'all') params.set('intent', intent)
    params.set('min_score', String(minScore))
    params.set('limit', '200')
    adk
      .get<{ items: AdkLead[] }>(`/leads?${params}`)
      .then((d) => setLeads(d.items || []))
      .catch((e) => setError((e as Error).message))
  }, [intent, minScore])

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col sm:flex-row sm:items-end gap-4 animate-fade-up">
        <div className="flex-1">
          <label className="block text-nav font-medium text-navy mb-2">Intent</label>
          <div className="relative">
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent appearance-none pr-10"
            >
              {intents.map((i) => (
                <option key={i} value={i}>
                  {i === 'all' ? 'All intents' : i.charAt(0).toUpperCase() + i.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-nav font-medium text-navy mb-2">
            Minimum score: {minScore}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-action"
          />
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up animate-fade-up-2">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
          <h2 className="text-h4 text-navy">All Leads</h2>
          <span className="text-caption text-subtle">
            {leads === null ? '—' : `${leads.length} matching`}
          </span>
        </div>

        {leads === null ? (
          <PageLoading />
        ) : leads.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No leads match the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Intent / Requirements</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-beige/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{lead.name || 'Anonymous'}</p>
                      <p className="text-caption text-subtle">
                        {lead.phone || lead.email || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy capitalize">
                        {lead.intent || 'unknown'}
                        {lead.property_type ? ` · ${lead.property_type}` : ''}
                      </p>
                      <p className="text-caption text-subtle">
                        {lead.budget || 'No budget'}
                        {lead.location_preference ? ` · ${lead.location_preference}` : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-caption font-semibold ${statusClass(lead.status)}`}
                      >
                        {lead.status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-caption font-bold ${scoreClass(lead.score)}`}
                      >
                        {lead.score ?? 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatDateTime(lead.created_at)}
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
