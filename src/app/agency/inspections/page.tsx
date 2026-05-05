'use client'

import { useEffect, useState } from 'react'
import { agency } from '@/lib/agency-api'
import { formatDateTime, statusClass } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Appt {
  id: string
  status?: string
  scheduled_for?: string
  date?: string
  time?: string
  property_id?: string
  property_title?: string
  buyer_name?: string
  buyer_phone?: string
  notes?: string
}

type Resp = { items?: Appt[]; data?: Appt[] } | Appt[]

export default function AgencyInspectionsPage() {
  const [items, setItems] = useState<Appt[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    agency
      .get<Resp>('/inspections?limit=500')
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))
  }, [])

  const updateStatus = async (id: string, next: string) => {
    try {
      await agency.send(`/inspections/${encodeURIComponent(id)}`, 'PATCH', { status: next })
      setItems((p) => (p ? p.map((a) => (a.id === id ? { ...a, status: next } : a)) : p))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/inspections not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (items === null) return <PageLoading />

  const now = Date.now()
  const filtered = items.filter((a) => {
    if (scope === 'all') return true
    const when = a.scheduled_for || a.date
    if (!when) return false
    const t = new Date(when).getTime()
    return scope === 'upcoming' ? t >= now : t < now
  })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card border border-divider shadow-card p-1 inline-flex">
        {(['upcoming', 'past', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 rounded-button text-body-sm font-semibold capitalize transition-colors ${
              scope === s ? 'bg-action text-white' : 'text-subtle hover:bg-beige'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No {scope === 'all' ? '' : scope + ' '}inspections.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Buyer</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-beige/30">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">
                        {formatDateTime(a.scheduled_for || a.date)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {a.property_title || `#${a.property_id || '—'}`}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy">{a.buyer_name || '—'}</p>
                      <p className="text-caption text-subtle">{a.buyer_phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={a.status || 'scheduled'}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className={`px-2 py-1 rounded text-caption font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-action ${statusClass(a.status)}`}
                      >
                        {['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, ' ')}
                            </option>
                          ),
                        )}
                      </select>
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
