'use client'

import { useEffect, useState } from 'react'
import type { BackendLead } from '@/lib/types'
import { be } from '@/lib/client-api'
import { statusClass, formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

type Resp = { items?: BackendLead[]; data?: BackendLead[] } | BackendLead[]

const statuses = ['all', 'new', 'contacted', 'viewing_scheduled', 'converted', 'dead']

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<BackendLead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    setItems(null)
    setError(null)
    try {
      const v = await be.get<Resp>('/leads?limit=500')
      const list = Array.isArray(v) ? v : v.items || v.data || []
      setItems(list)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, next: string) => {
    setUpdating(id)
    try {
      await be.send(`/leads/${encodeURIComponent(id)}/status`, 'PATCH', { status: next })
      setItems((prev) =>
        prev ? prev.map((l) => (l.id === id ? { ...l, status: next } : l)) : prev,
      )
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setUpdating(null)
    }
  }

  const sendWhatsApp = async (id: string) => {
    const message = prompt('Message to send via WhatsApp:')
    if (!message) return
    try {
      await be.send(`/leads/${encodeURIComponent(id)}/whatsapp`, 'POST', { message })
      alert('Message queued via WhatsApp')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (error) return <PageError message={error} />

  const filtered = (items || []).filter((l) =>
    status === 'all' ? true : (l.status || '').toLowerCase() === status,
  )

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-nav font-medium text-navy mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <p className="text-caption text-subtle ml-auto">
          {items === null ? '—' : `${filtered.length} inquiries`}
        </p>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {items === null ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">No inquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Inquiry</th>
                  <th className="px-6 py-3">Intent / Property</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-beige/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{lead.name || 'Anonymous'}</p>
                      <p className="text-caption text-subtle">
                        {lead.phone || lead.email || '—'}
                      </p>
                      {lead.message && (
                        <p className="text-caption text-subtle mt-1 line-clamp-2 max-w-xs">
                          “{lead.message}”
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy capitalize">
                        {lead.intent || 'unknown'}
                      </p>
                      <p className="text-caption text-subtle">
                        {lead.property_id ? `Property #${lead.property_id}` : '—'}
                      </p>
                      {lead.budget && (
                        <p className="text-caption text-subtle">{lead.budget}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status || ''}
                        disabled={updating === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`px-2 py-1 rounded text-caption font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-action ${statusClass(lead.status)}`}
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
                      {formatDateTime(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => sendWhatsApp(lead.id)}
                        disabled={!lead.phone}
                        className="text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button disabled:opacity-50"
                      >
                        WhatsApp
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
