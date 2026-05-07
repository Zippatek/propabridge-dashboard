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
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    listing_id: '',
    property_title: '',
    buyer_name: '',
    buyer_phone: '',
    scheduleDate: '',
    scheduleTime: '10:00',
    notes: '',
  })

  const reload = () =>
    agency
      .get<Resp>('/inspections?limit=500')
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))

  useEffect(() => { reload() }, [])

  const createAppt = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await agency.send('/inspections', 'POST', {
        listing_id: form.listing_id,
        property_title: form.property_title || undefined,
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        date: form.scheduleDate,
        time: form.scheduleTime,
        notes: form.notes || undefined,
      })
      setForm({
        listing_id: '',
        property_title: '',
        buyer_name: '',
        buyer_phone: '',
        scheduleDate: '',
        scheduleTime: '10:00',
        notes: '',
      })
      setShowForm(false)
      reload()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

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
      <PageError message={error} />
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:opacity-90"
        >
          {showForm ? 'Cancel' : 'Schedule inspection'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createAppt}
          className="bg-white rounded-card border border-divider shadow-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label className="text-body-sm text-navy md:col-span-1">
            Listing ID
            <input
              required
              value={form.listing_id}
              onChange={(e) => setForm({ ...form, listing_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy md:col-span-1">
            Property title (optional)
            <input
              value={form.property_title}
              onChange={(e) => setForm({ ...form, property_title: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy">
            Buyer name
            <input
              required
              value={form.buyer_name}
              onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy">
            Buyer phone
            <input
              required
              value={form.buyer_phone}
              onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy">
            Date
            <input
              required
              type="date"
              value={form.scheduleDate}
              onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy">
            Time
            <input
              required
              type="time"
              value={form.scheduleTime}
              onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <label className="text-body-sm text-navy md:col-span-2">
            Notes (optional)
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-input border border-divider focus:outline-none focus:ring-2 focus:ring-action"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold disabled:opacity-50"
            >
              {creating ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      )}

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
                        value={a.status || 'pending'}
                        onChange={(e) => updateStatus(a.id, e.target.value)}
                        className={`px-2 py-1 rounded text-caption font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-action ${statusClass(a.status)}`}
                      >
                        {['pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
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
