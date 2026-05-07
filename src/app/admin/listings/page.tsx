'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  Search,
  Star,
  StarOff,
  Pencil,
  X,
  Check,
  ExternalLink,
  ChevronDown,
  Home,
  Plus,
  Sparkles,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import AddListingDrawer from '@/components/admin/AddListingDrawer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string
  title?: string
  slug?: string
  city?: string
  listing_type?: string
  property_type?: string
  bedrooms?: number | null
  bathrooms?: number | null
  size_sqm?: number | null
  price?: number | null
  previous_price?: number | null
  cover_image_url?: string | null
  featured?: boolean
  verification_status?: string
  agency_name?: string
  agency_id?: string
  created_at?: string
  updated_at?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n?: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n}`
}

const STATUS_STYLES: Record<string, string> = {
  verified:  'bg-verified-light text-verified border border-verified/20',
  submitted: 'bg-gold/15 text-amber-700 border border-gold/30',
  rejected:  'bg-danger-light text-danger border border-danger/20',
  draft:     'bg-beige text-subtle border border-divider',
  in_review: 'bg-action-light text-action border border-action/20',
  needs_info:'bg-orange-50 text-orange-700 border border-orange-200',
}

function StatusPill({ status }: { status?: string }) {
  const s = status || 'draft'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[s] ?? STATUS_STYLES.draft}`}>
      {s.replace(/_/g, ' ')}
    </span>
  )
}

// ─── Edit Drawer ─────────────────────────────────────────────────────────────

interface EditDrawerProps {
  listing: Listing
  onClose: () => void
  onSaved: (updated: Listing) => void
}

const LISTING_TYPES   = ['sale', 'rent', 'shortlet']
const PROPERTY_TYPES  = ['apartment', 'house', 'duplex', 'bungalow', 'land', 'commercial', 'villa', 'penthouse']
const VERIFY_STATUSES = ['draft', 'submitted', 'in_review', 'needs_info', 'verified', 'rejected']

function EditDrawer({ listing, onClose, onSaved }: EditDrawerProps) {
  const [form, setForm] = useState({
    title:               listing.title || '',
    city:                listing.city  || '',
    price:               listing.price ? String(listing.price) : '',
    listing_type:        listing.listing_type  || 'sale',
    property_type:       listing.property_type || 'apartment',
    bedrooms:            listing.bedrooms  != null ? String(listing.bedrooms)  : '',
    bathrooms:           listing.bathrooms != null ? String(listing.bathrooms) : '',
    size_sqm:            listing.size_sqm  != null ? String(listing.size_sqm)  : '',
    slug:                listing.slug || '',
    featured:            listing.featured || false,
    verification_status: listing.verification_status || 'draft',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      const payload: Record<string, unknown> = {
        title:               form.title               || undefined,
        city:                form.city                || undefined,
        slug:                form.slug                || undefined,
        listing_type:        form.listing_type,
        property_type:       form.property_type,
        featured:            form.featured,
        verification_status: form.verification_status,
      }
      if (form.price    !== '') payload.price    = Number(form.price)
      if (form.bedrooms !== '') payload.bedrooms  = Number(form.bedrooms)
      if (form.bathrooms!== '') payload.bathrooms = Number(form.bathrooms)
      if (form.size_sqm !== '') payload.size_sqm  = Number(form.size_sqm)

      const updated = await be.send<Listing>(`/listings/${listing.id}`, 'PATCH', payload)
      onSaved({ ...listing, ...updated })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'

  const selectCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 appearance-none'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-40 animate-fade-up"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <div>
            <p className="text-caption text-subtle uppercase tracking-wide font-semibold">Edit Listing</p>
            <h3 className="text-h4 text-navy mt-0.5 line-clamp-1">{listing.title || 'Untitled'}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-button hover:bg-beige text-subtle hover:text-navy transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Title</span>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Listing title" />
          </label>

          {/* City + Slug */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">City</span>
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Abuja" />
            </label>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Slug</span>
              <input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="url-slug" />
            </label>
          </div>

          {/* Price */}
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Price (₦)</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="e.g. 45000000"
            />
            {form.price && (
              <p className="text-[11px] text-action mt-1">{formatPrice(Number(form.price))}</p>
            )}
          </label>

          {/* Listing Type + Property Type */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Listing type</span>
              <div className="relative">
                <select className={selectCls} value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
                  {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
              </div>
            </label>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Property type</span>
              <div className="relative">
                <select className={selectCls} value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
              </div>
            </label>
          </div>

          {/* Beds / Baths / sqm */}
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Beds</span>
              <input className={inputCls} type="number" min={0} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="—" />
            </label>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Baths</span>
              <input className={inputCls} type="number" min={0} value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="—" />
            </label>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">sqm</span>
              <input className={inputCls} type="number" min={0} value={form.size_sqm} onChange={e => set('size_sqm', e.target.value)} placeholder="—" />
            </label>
          </div>

          {/* Verification status */}
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Verification status</span>
            <div className="relative">
              <select className={selectCls} value={form.verification_status} onChange={e => set('verification_status', e.target.value)}>
                {VERIFY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            </div>
          </label>

          {/* Featured toggle */}
          <div className="flex items-center justify-between bg-beige rounded-card px-4 py-3 border border-divider">
            <div>
              <p className="text-body-sm text-navy font-semibold">Featured listing</p>
              <p className="text-caption text-subtle">Pinned to homepage and search top</p>
            </div>
            <button
              onClick={() => set('featured', !form.featured)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.featured ? 'bg-action' : 'bg-divider'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.featured ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Agency (read-only) */}
          {listing.agency_name && (
            <div className="bg-beige rounded-card px-4 py-3 border border-divider">
              <p className="text-caption text-subtle font-semibold mb-0.5">Agency</p>
              <p className="text-body-sm text-navy">{listing.agency_name}</p>
            </div>
          )}

          {err && (
            <div className="bg-danger-light border border-danger/20 text-danger text-body-sm rounded-card px-4 py-3">
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-divider flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-white font-semibold py-3 rounded-button transition-all duration-150 disabled:opacity-50"
          >
            <Check size={15} strokeWidth={2.5} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-button border border-divider text-subtle hover:text-navy hover:bg-beige text-body-sm font-semibold transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['all', 'verified', 'submitted', 'in_review', 'needs_info', 'draft', 'rejected']

export default function AdminListingsPage() {
  const [listings, setListings]     = useState<Listing[] | null>(null)
  const [total, setTotal]           = useState(0)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('all')
  const [editTarget, setEditTarget] = useState<Listing | null>(null)
  const [togglingId, setToggling]   = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((q: string, status: string) => {
    setError(null)
    const params = new URLSearchParams({ limit: '50' })
    if (q)                   params.set('q', q)
    if (status !== 'all')    params.set('status', status)
    be.get<Record<string, unknown>>(`/listings?${params}`)
      .then(d => {
        // Backend returns { success, count, data[] } — normalize to expected shape
        const raw = ((d.items || d.data || []) as Record<string, unknown>[])
        const items: Listing[] = raw.map(item => ({
          id:                  String(item.id ?? ''),
          title:               item.title               as string | undefined,
          slug:                item.slug                as string | undefined,
          city:                item.city                as string | undefined,
          listing_type:        (item.listing_type || item.transaction_type) as string | undefined,
          property_type:       (item.property_type || item.type)            as string | undefined,
          bedrooms:            item.bedrooms  as number | null | undefined,
          bathrooms:           item.bathrooms as number | null | undefined,
          size_sqm:            item.size_sqm  as number | null | undefined,
          price:               item.price     as number | null | undefined,
          previous_price:      item.previous_price as number | null | undefined,
          cover_image_url:     (item.cover_image_url || (Array.isArray(item.images) ? item.images[0] : null)) as string | null | undefined,
          featured:            item.featured as boolean | undefined,
          verification_status: (item.verification_status || (item.verified ? 'verified' : 'draft')) as string | undefined,
          agency_name:         (item.agency_name || item.agent)  as string | undefined,
          agency_id:           item.agency_id as string | undefined,
          created_at:          item.created_at as string | undefined,
          updated_at:          item.updated_at as string | undefined,
        }))
        setListings(items)
        setTotal((d.total as number) || (d.count as number) || 0)
      })
      .catch(e => setError((e as Error).message))
  }, [])

  useEffect(() => { load(search, statusFilter) }, []) // eslint-disable-line

  // Debounced search
  const handleSearch = (v: string) => {
    setSearch(v)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => load(v, statusFilter), 420)
  }

  const handleStatusFilter = (s: string) => {
    setStatus(s)
    load(search, s)
  }

  const toggleFeatured = async (l: Listing) => {
    setToggling(l.id)
    try {
      await be.send(`/listings/${l.id}`, 'PATCH', { featured: !l.featured })
      setListings(prev => prev?.map(x => x.id === l.id ? { ...x, featured: !l.featured } : x) ?? null)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  const handleSaved = (updated: Listing) => {
    setListings(prev => prev?.map(x => x.id === updated.id ? { ...x, ...updated } : x) ?? null)
    setEditTarget(null)
  }

  if (error) return <PageError message={error} />

  return (
    <>
      {/* Edit drawer */}
      {editTarget && (
        <EditDrawer
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Add listing drawer */}
      {showAdd && (
        <AddListingDrawer
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(search, statusFilter) }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-h3 text-navy">Listings</h1>
            <p className="text-body-sm text-subtle mt-0.5">
              {listings === null ? '…' : `${total} properties`} in the database
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-action hover:bg-action-hover text-white text-body-sm font-semibold rounded-button transition-all duration-150 shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            <Sparkles size={13} strokeWidth={2} className="opacity-80" />
            Add listing
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder pointer-events-none" />
            <input
              type="search"
              placeholder="Search by title or city…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-input border border-divider bg-white text-navy placeholder-placeholder text-body-sm
                         focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-3 py-1.5 rounded-badge text-caption font-semibold capitalize transition-all duration-150 ${
                  statusFilter === s
                    ? 'bg-action text-white'
                    : 'bg-white border border-divider text-subtle hover:text-navy hover:bg-beige'
                }`}
              >
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Cards */}
        {listings === null ? (
          <PageLoading />
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-card border border-divider shadow-card p-20 text-center text-subtle">
            <Home size={48} strokeWidth={1.2} className="mx-auto text-divider mb-4" />
            <p className="text-body-sm">No listings found. Adjust your search or filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/60 text-caption font-semibold text-subtle uppercase tracking-wider border-b border-divider">
                  <th className="px-5 py-3 w-12" />
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3 hidden md:table-cell">Agency</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Type</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-beige/30 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-3 py-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-beige flex-shrink-0 flex items-center justify-center">
                        {l.cover_image_url ? (
                          <Image
                            src={l.cover_image_url}
                            alt={l.title || 'listing'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Building2 size={18} strokeWidth={1.3} className="text-divider" />
                        )}
                      </div>
                    </td>

                    {/* Title + city */}
                    <td className="px-5 py-3 max-w-[220px]">
                      <p className="font-semibold text-navy text-body-sm line-clamp-1">{l.title || 'Untitled'}</p>
                      <p className="text-caption text-subtle mt-0.5">{l.city || '—'}</p>
                      {l.featured && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-gold">
                          <Star size={10} strokeWidth={2} /> Featured
                        </span>
                      )}
                    </td>

                    {/* Agency */}
                    <td className="px-5 py-3 hidden md:table-cell">
                      <p className="text-body-sm text-subtle">{l.agency_name || '—'}</p>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <p className="text-caption text-navy capitalize">{l.listing_type || '—'}</p>
                      <p className="text-caption text-subtle capitalize">{l.property_type || ''}</p>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3">
                      <p className="text-body-sm font-bold text-action">{formatPrice(l.price)}</p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <StatusPill status={l.verification_status} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Featured toggle */}
                        <button
                          onClick={() => toggleFeatured(l)}
                          disabled={togglingId === l.id}
                          title={l.featured ? 'Remove from featured' : 'Mark as featured'}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-button text-caption font-semibold transition-all duration-150 disabled:opacity-50 ${
                            l.featured
                              ? 'bg-gold/20 text-amber-700 hover:bg-gold/30'
                              : 'bg-beige text-subtle hover:bg-beige/70 hover:text-navy'
                          }`}
                        >
                          {l.featured
                            ? <StarOff size={12} strokeWidth={2} />
                            : <Star    size={12} strokeWidth={2} />}
                          <span className="hidden sm:inline">{l.featured ? 'Unfeature' : 'Feature'}</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(l)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-action-light text-action hover:bg-action hover:text-white text-caption font-semibold transition-all duration-150"
                        >
                          <Pencil size={12} strokeWidth={2} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* View on site */}
                        {l.slug && (
                          <a
                            href={`https://propabridge.com/properties/${l.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-beige text-subtle hover:text-action text-caption font-semibold transition-all duration-150"
                            title="View on site"
                          >
                            <ExternalLink size={12} strokeWidth={2} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-divider bg-beige/30 flex items-center justify-between">
              <p className="text-caption text-subtle">
                Showing {listings.length} of {total} listing{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
