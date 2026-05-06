'use client'

import { useEffect, useState } from 'react'
import { Phone, MessageSquare } from 'lucide-react'
import { agency } from '@/lib/agency-api'
import { scoreClass, statusClass, formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Lead {
  id: string
  name?: string
  phone?: string
  email?: string
  intent?: string
  budget?: string
  property_id?: string
  property_title?: string
  score?: number
  status?: string
  created_at?: string
}

type Resp = { items?: Lead[]; data?: Lead[] } | Lead[]

const statuses = ['all', 'new', 'contacted', 'viewing_scheduled', 'converted', 'dead']
const WHATSAPP = process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348055551300'

export default function AgencyLeadsPage() {
  const [items, setItems] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('all')

  const load = () => {
    setItems(null)
    setError(null)
    agency
      .get<Resp>('/leads?limit=500')
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))
  }
  useEffect(load, [])

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/leads not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (items === null) return <PageLoading />

  const filtered = items.filter((l) =>
    status === 'all' ? true : (l.status || '').toLowerCase() === status,
  )

  const updateStatus = async (id: string, next: string) => {
    try {
      await agency.send(`/leads/${encodeURIComponent(id)}/status`, 'PATCH', { status: next })
      setItems((p) => (p ? p.map((l) => (l.id === id ? { ...l, status: next } : l)) : p))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label className="block text-nav font-medium text-navy mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <p className="text-caption text-subtle ml-auto">{filtered.length} leads</p>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">No leads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-beige/30">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{l.name || 'Anonymous'}</p>
                      <p className="text-caption text-subtle">
                        {l.phone || l.email || '—'}
                      </p>
                      <p className="text-caption text-subtle capitalize mt-0.5">
                        {l.intent || '—'} · {l.budget || 'no budget'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {l.property_title || (l.property_id ? `#${l.property_id}` : '—')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded text-caption font-bold ${scoreClass(l.score)}`}
                      >
                        {l.score ?? 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={l.status || 'new'}
                        onChange={(e) => updateStatus(l.id, e.target.value)}
                        className={`px-2 py-1 rounded text-caption font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-action ${statusClass(l.status)}`}
                      >
                        {statuses
                          .filter((s) => s !== 'all')
                          .map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ')}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        {l.phone && (
                          <a
                            href={`tel:${l.phone}`}
                            className="p-2 rounded-button bg-action-light text-action hover:bg-action hover:text-white"
                            aria-label="Call"
                          >
                            <Phone size={14} strokeWidth={1.8} />
                          </a>
                        )}
                        <a
                          href={`https://wa.me/${l.phone ? l.phone.replace(/[^0-9]/g, '') : WHATSAPP}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-button bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white"
                          aria-label="WhatsApp"
                        >
                          <MessageSquare size={14} strokeWidth={1.8} />
                        </a>
                      </div>
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
