'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, X, Check } from 'lucide-react'
import { be } from '@/lib/client-api'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface N {
  id: string
  slug?: string
  name: string
  city: string
  safetyScore?: number
  averagePrice?: number
  listingCount?: number
  population?: number
  coverImage?: string
  description?: string
  amenities?: Record<string, unknown>
  demographics?: Record<string, unknown>
}

export default function NeighborhoodsPage() {
  const [items, setItems] = useState<N[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<N> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await be.get<{ neighborhoods: N[] }>('/neighborhoods?limit=200')
      setItems(json.neighborhoods || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const onSave = async () => {
    if (!editing?.name || !editing?.city) { alert('Name and city required'); return }
    setSaving(true)
    try {
      const payload = {
        slug: editing.slug,
        name: editing.name,
        city: editing.city,
        safety_score: editing.safetyScore,
        average_price: editing.averagePrice,
        population: editing.population,
        cover_image: editing.coverImage,
        description: editing.description,
      }
      if (editing.id) {
        await be.send(`/neighborhoods/${editing.slug || editing.id}`, 'PATCH', payload)
      } else {
        await be.send('/neighborhoods', 'POST', payload)
      }
      setEditing(null)
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  if (loading) return <PageLoading label="Loading neighborhoods..." />
  if (error) return <PageError message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-dashboard mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 text-navy">Neighborhoods</h1>
          <p className="text-body-sm text-subtle mt-1">{items.length} total</p>
        </div>
        <button onClick={() => setEditing({ city: 'Abuja' })} className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:bg-action-hover">
          <Plus size={16} /> New Neighborhood
        </button>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-beige border-b border-divider">
            <tr className="text-left text-caption text-subtle uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Safety</th>
              <th className="px-4 py-3">Avg Price</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-b border-divider/50 hover:bg-beige/30">
                <td className="px-4 py-3 text-body-sm font-medium text-navy">{n.name}</td>
                <td className="px-4 py-3 text-body-sm">{n.city}</td>
                <td className="px-4 py-3 text-body-sm">{n.safetyScore ?? '—'}</td>
                <td className="px-4 py-3 text-body-sm">{n.averagePrice ? `₦${(n.averagePrice / 1_000_000).toFixed(0)}M` : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditing(n)} className="text-subtle hover:text-action"><Pencil size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-navy/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-card shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-divider">
              <h2 className="text-h3 text-navy">{editing.id ? 'Edit Neighborhood' : 'New Neighborhood'}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <Input label="Slug" value={editing.slug || ''} onChange={(v) => setEditing({ ...editing, slug: v })} mono />
              <Input label="Name *" value={editing.name || ''} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Input label="City *" value={editing.city || ''} onChange={(v) => setEditing({ ...editing, city: v })} />
              <div className="grid grid-cols-3 gap-4">
                <Input label="Safety Score" value={String(editing.safetyScore ?? '')} onChange={(v) => setEditing({ ...editing, safetyScore: Number(v) || undefined })} />
                <Input label="Avg Price" value={String(editing.averagePrice ?? '')} onChange={(v) => setEditing({ ...editing, averagePrice: Number(v) || undefined })} />
                <Input label="Population" value={String(editing.population ?? '')} onChange={(v) => setEditing({ ...editing, population: Number(v) || undefined })} />
              </div>
              <Input label="Cover Image URL" value={editing.coverImage || ''} onChange={(v) => setEditing({ ...editing, coverImage: v })} mono />
              <div>
                <label className="block text-caption font-semibold text-subtle uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-input border border-divider text-body-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t border-divider">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-button border border-divider text-body-sm">Cancel</button>
              <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:bg-action-hover disabled:opacity-50">
                <Check size={16} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <label className="block text-caption font-semibold text-subtle uppercase tracking-wide mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`w-full px-3 py-2 rounded-input border border-divider text-body-sm focus:outline-none focus:border-action ${mono ? 'font-mono' : ''}`} />
    </div>
  )
}
