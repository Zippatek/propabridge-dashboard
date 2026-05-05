'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Building2, MapPin, BedDouble } from 'lucide-react'
import { Badge } from '@/components/ui'
import { agency } from '@/lib/agency-api'
import { formatNaira } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Listing {
  id: string
  title?: string
  price?: number
  type?: 'sale' | 'rent'
  city?: string
  neighborhood?: string
  bedrooms?: number
  status?: 'active' | 'pending' | 'sold' | 'inactive'
  verification_status?: string
  open_blocks?: number
  images?: string[]
  views?: number
  leads?: number
}

type Resp = { items?: Listing[]; data?: Listing[] } | Listing[]

export default function AgencyListingsPage() {
  const [items, setItems] = useState<Listing[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'sold'>('all')

  useEffect(() => {
    agency
      .get<Resp>('/listings?limit=200')
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/listings not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (items === null) return <PageLoading />

  const filtered = items.filter((l) => filter === 'all' || l.status === filter)
  const counts = {
    all: items.length,
    active: items.filter((l) => l.status === 'active').length,
    pending: items.filter((l) => l.status === 'pending').length,
    sold: items.filter((l) => l.status === 'sold').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="bg-white rounded-card border border-divider shadow-card p-1 inline-flex">
          {(['all', 'active', 'pending', 'sold'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-button text-body-sm font-semibold capitalize transition-colors ${
                filter === s ? 'bg-action text-white' : 'text-subtle hover:bg-beige'
              }`}
            >
              {s} <span className="opacity-60">({counts[s]})</span>
            </button>
          ))}
        </div>
        <button className="bg-action hover:bg-action-hover text-white font-semibold px-5 py-3 rounded-button flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} strokeWidth={2} />
          Add listing
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-card border border-divider p-12 text-center">
          <Building2 size={32} strokeWidth={1.2} className="text-divider mx-auto mb-3" />
          <p className="text-body-sm text-subtle">
            No {filter === 'all' ? '' : filter + ' '}listings yet. Click <b>Add listing</b> to
            upload your first property.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-card border border-divider shadow-card overflow-hidden card-lift"
            >
              <div className="relative h-48 bg-beige">
                {l.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-divider">
                    <Building2 size={32} strokeWidth={1.2} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  {l.type === 'sale' ? (
                    <Badge variant="sale">FOR SALE</Badge>
                  ) : (
                    <Badge variant="rent">FOR RENT</Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                  <span
                    className={`px-2 py-1 rounded text-caption font-semibold ${
                      l.status === 'active'
                        ? 'bg-verified-light text-verified'
                        : l.status === 'pending'
                          ? 'bg-warning-light text-warning'
                          : l.status === 'sold'
                            ? 'bg-action-light text-action'
                            : 'bg-beige text-subtle'
                    }`}
                  >
                    {l.status}
                  </span>
                  {l.verification_status && l.verification_status !== 'verified' && (
                    <span className={`px-2 py-1 rounded text-caption font-semibold ${
                      l.verification_status === 'submitted'
                        ? 'bg-warning-light text-warning'
                        : l.verification_status === 'rejected'
                          ? 'bg-danger-light text-danger'
                          : 'bg-beige text-subtle'
                    }`}>
                      {l.verification_status === 'needs_info' ? '⚠ needs info' : l.verification_status}
                    </span>
                  )}
                  {l.verification_status === 'verified' && (
                    <span className="px-2 py-1 rounded text-caption font-semibold bg-verified-light text-verified">✓ verified</span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2">
                <p className="text-h3 text-navy font-bold">
                  {l.price ? formatNaira(l.price) : '—'}
                  {l.type === 'rent' && (
                    <span className="text-caption text-subtle font-normal">/yr</span>
                  )}
                </p>
                <h4 className="text-body text-navy font-semibold truncate">
                  {l.title || `Listing ${l.id}`}
                </h4>
                <p className="flex items-center gap-1.5 text-caption text-subtle">
                  <MapPin size={12} strokeWidth={1.5} />
                  {l.neighborhood ? `${l.neighborhood}, ` : ''}
                  {l.city || '—'}
                </p>
                {l.bedrooms != null && (
                  <p className="flex items-center gap-1.5 text-caption text-subtle">
                    <BedDouble size={12} strokeWidth={1.5} />
                    {l.bedrooms} bed{l.bedrooms === 1 ? '' : 's'}
                  </p>
                )}

                <div className="pt-3 mt-3 border-t border-divider flex items-center justify-between">
                  <div className="text-caption text-subtle">
                    {l.views ?? 0} views · {l.leads ?? 0} leads
                  </div>
                  <button className="text-body-sm font-semibold text-action hover:text-action-hover flex items-center gap-1">
                    <Edit size={12} strokeWidth={2} />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
