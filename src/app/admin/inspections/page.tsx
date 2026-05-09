'use client'

import { useEffect, useState } from 'react'
import type { BackendAppointment } from '@/lib/types'
import { be } from '@/lib/client-api'
import { statusClass, formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

type Resp =
  | { items?: BackendAppointment[]; data?: BackendAppointment[] }
  | BackendAppointment[]

export default function AdminInspectionsPage() {
  const [items, setItems] = useState<BackendAppointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    setItems(null)
    setError(null)
    be.get<Resp>('/admin/appointments?limit=500')
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))
  }, [])

  const remind = async (id: string) => {
    try {
      await be.send(`/scheduler/remind/${encodeURIComponent(id)}`, 'POST', {
        type: 'reminder',
      })
      alert('Reminder sent')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await be.send(`/scheduler/appointments/${encodeURIComponent(id)}`, 'PATCH', { status })
      setItems((prev) =>
        prev ? prev.map((a) => (a.id === id ? { ...a, status } : a)) : prev,
      )
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (error) return <PageError message={error} />

  const now = Date.now()
  const filtered = (items || []).filter((a) => {
    const when = a.scheduled_for || a.date
    if (scope === 'all') return true
    if (!when) return false
    const t = new Date(when).getTime()
    return scope === 'upcoming' ? t >= now : t < now
  })

  const statusOptions = ['scheduled', 'pending', 'confirmed', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-1 inline-flex">
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
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {items === null ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No {scope === 'all' ? '' : scope + ' '}inspections found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Agency</th>
                  <th className="px-6 py-3">Property / Lead</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-beige/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">
                        {formatDateTime(a.scheduled_for || a.date)}
                      </p>
                      {a.time && <p className="text-caption text-subtle">{a.time}</p>}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {a.agency_name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy">
                        {a.property_id ? `#${a.property_id}` : '—'}
                      </p>
                      <p className="text-caption text-subtle">
                        {a.lead_id ? `Lead ${a.lead_id}` : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={a.status || 'scheduled'}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className={`px-2 py-1 rounded text-caption font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-action ${statusClass(a.status)}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-caption text-subtle line-clamp-2">{a.notes || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => remind(a.id)}
                        className="text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button"
                      >
                        Send reminder
                      </button>
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
