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
  ExternalLink,
  Home,
  Plus,
  Sparkles,
  Trash2,
  GripVertical,
  Send,
  FileText,
  Loader2,
  Check,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { normalizeListingType } from '@/lib/listing-type'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import AddListingDrawer from '@/components/admin/AddListingDrawer'
import { AdminListing, RewriteResult } from '@/lib/types'
import { ListingEditForm } from '@/components/admin/ListingEditForm'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n?: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n}`
}

function firstNonEmptyString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

/** Prefer the canonical copy field whichever shape the gateway returns. */
function listingDescriptionFromRow(item: Record<string, unknown>): string | null {
  const s = firstNonEmptyString(
    item.description,
    item.long_description,
    item.longDescription,
    item.description_md,
    item.description_markdown,
    item.long_description_md,
    item.long_description_markdown,
  )
  return s ?? null
}

/**
 * PATCH body for AI rewrite apply — mirrors manual `description` save and adds
 * aliases the api-gateway / property row may persist (`*_md`, `long_*`).
 */
function buildRewriteListingPatchBody(
  descriptionMarkdown: string,
  summary: string,
  searchKeywords: string[],
): Record<string, unknown> {
  const md = descriptionMarkdown.trim()
  const body: Record<string, unknown> = {
    description: md,
    description_md: md,
    long_description: md,
    long_description_md: md,
  }
  const sum = summary.trim()
  if (sum) body.summary = sum
  if (searchKeywords.length) body.search_keywords = searchKeywords
  return body
}

const STATUS_STYLES: Record<string, string> = {
  verified: 'bg-verified-light text-verified border border-verified/20',
  submitted: 'bg-gold/15 text-amber-700 border border-gold/30',
  rejected: 'bg-danger-light text-danger border border-danger/20',
  draft: 'bg-beige text-subtle border border-divider',
  in_review: 'bg-action-light text-action border border-action/20',
  needs_info: 'bg-orange-50 text-orange-700 border border-orange-200',
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
  listing: AdminListing
  onClose: () => void
  onSaved: (updated: AdminListing) => void
}

function EditDrawer({ listing, onClose, onSaved }: EditDrawerProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-40 animate-fade-up"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider flex-shrink-0">
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

        <div className="flex-1 overflow-hidden">
          <ListingEditForm listing={listing} onSaved={onSaved} onCancel={onClose} />
        </div>
      </div>
    </>
  )
}


// ─── Rewrite Drawer (AI content rewrite) ─────────────────────────────────────

function RewriteDrawer({
  listing,
  onClose,
  onApplied,
}: {
  listing: AdminListing
  onClose: () => void
  onApplied: (updated: AdminListing) => void
}) {
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<RewriteResult | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true); setErr(null)
      try {
        const res = await fetch('/api/admin/ai-rewrite', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ propertyId: listing.id, property: listing }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Rewrite failed (${res.status})`)
        if (!cancelled) setResult(json as RewriteResult)
      } catch (e) {
        if (!cancelled) setErr((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [listing.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const apply = async () => {
    if (!result) return
    setApplying(true); setErr(null)
    try {
      const payload = buildRewriteListingPatchBody(
        result.description,
        result.summary,
        result.search_keywords || [],
      )
      const res = await be.send<any>(`/listings/${listing.id}`, 'PATCH', payload)
      // Best-effort embedding refresh — never blocks upstream 404/501.
      // Proxy: /api/admin/be/<path> → api-gateway /<path> (same prefix as /listings).
      fetch(`/api/admin/be/properties/${listing.id}/embed`, {
        method: 'POST',
        credentials: 'same-origin',
      }).catch(() => {})
      const md = result.description.trim()
      const updatedData = res?.data || res?.item || res || {}
      onApplied({ ...listing, ...payload, ...updatedData, description: md })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-40 animate-fade-up" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[640px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <div>
            <p className="text-caption text-subtle uppercase tracking-wide font-semibold flex items-center gap-1.5">
              <Sparkles size={12} className="text-action" /> AI Rewrite
            </p>
            <h3 className="text-h4 text-navy mt-0.5 line-clamp-1">{listing.title || 'Untitled'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-button hover:bg-beige text-subtle hover:text-navy">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-subtle text-body-sm">
              <Loader2 size={14} className="animate-spin" /> Generating clean copy from row data…
            </div>
          )}
          {err && (
            <div className="bg-danger-light border border-danger/20 text-danger text-body-sm rounded-card px-4 py-3">{err}</div>
          )}
          {result && (
            <>
              <div>
                <p className="text-caption text-subtle font-semibold uppercase tracking-wide mb-1.5">Summary (≤160 chars)</p>
                <div className="rounded-input border border-divider bg-beige/50 px-3 py-2.5 text-body-sm text-navy">
                  {result.summary || <span className="text-subtle italic">empty</span>}
                </div>
              </div>
              <div>
                <p className="text-caption text-subtle font-semibold uppercase tracking-wide mb-1.5">Search keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {(result.search_keywords || []).map(k => (
                    <span key={k} className="px-2 py-0.5 rounded-badge bg-action-light text-action text-[11px] font-semibold">{k}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-caption text-subtle font-semibold uppercase tracking-wide mb-1.5">Before</p>
                  <div className="rounded-input border border-divider bg-beige/30 px-3 py-2.5 text-body-sm text-subtle whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {result.before.description || <span className="italic">no description on file</span>}
                  </div>
                </div>
                <div>
                  <p className="text-caption text-subtle font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-action" /> After
                  </p>
                  <div className="rounded-input border-2 border-action/30 bg-white px-3 py-2.5 text-body-sm text-navy whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {result.description}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-divider flex items-center gap-3">
          <button
            onClick={apply}
            disabled={!result || applying || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-white font-semibold py-3 rounded-button disabled:opacity-50"
          >
            {applying ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
            {applying ? 'Applying…' : 'Apply rewrite'}
          </button>
          <button onClick={onClose} className="px-5 py-3 rounded-button border border-divider text-subtle hover:text-navy hover:bg-beige text-body-sm font-semibold">
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
  const [listings, setListings] = useState<AdminListing[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [editTarget, setEditTarget] = useState<AdminListing | null>(null)
  const [togglingId, setToggling] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [rewriteTarget, setRewriteTarget] = useState<AdminListing | null>(null)
  const [rewriteSavedToast, setRewriteSavedToast] = useState(false)

  const [bucketOrphans, setBucketOrphans] = useState<
    { url: string; path: string; agency_id?: string }[] | null
  >(null)
  const [bucketOrphansBusy, setBucketOrphansBusy] = useState(false)
  const [bucketOrphansErr, setBucketOrphansErr] = useState<string | null>(null)
  const [attachPidByPath, setAttachPidByPath] = useState<Record<string, string>>({})

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback((q: string, status: string) => {
    setError(null)
    const params = new URLSearchParams({ limit: '50' })
    if (q) params.set('q', q)
    if (status !== 'all') params.set('status', status)
    be.get<Record<string, unknown>>(`/listings?${params}`)
      .then(d => {
        // Backend returns { success, count, data[] } — normalize to expected shape
        const raw = ((d.items || d.data || []) as Record<string, unknown>[])
        const items: AdminListing[] = raw.map(item => ({
          id: String(item.id ?? ''),
          title: item.title as string | undefined,
          slug: item.slug as string | undefined,
          city: item.city as string | undefined,
          listing_type: normalizeListingType(
            (item.listing_type || item.transaction_type) as string | undefined,
          ),
          property_type: (item.property_type || item.type) as string | undefined,
          bedrooms: item.bedrooms as number | null | undefined,
          bathrooms: item.bathrooms as number | null | undefined,
          size_sqm: item.size_sqm as number | null | undefined,
          price: item.price as number | null | undefined,
          previous_price: item.previous_price as number | null | undefined,
          cover_image_url: (item.cover_image_url || (Array.isArray(item.images) ? item.images[0] : null)) as string | null | undefined,
          images: (Array.isArray(item.images) ? item.images : []) as string[],
          amenities: (Array.isArray(item.amenities) ? item.amenities : []) as string[],
          construction_status: item.construction_status as string | null | undefined,
          condition: item.condition as string | null | undefined,
          intent: item.intent as string | null | undefined,
          description: listingDescriptionFromRow(item),
          neighborhood: item.neighborhood as string | null | undefined,
          address: item.address as string | null | undefined,
          payment_plan: item.payment_plan as string | null | undefined,
          service_charge_ngn_per_year: item.service_charge_ngn_per_year as number | null | undefined,
          propabridge_commission_pct: item.propabridge_commission_pct as number | null | undefined,
          attribution_window_months: item.attribution_window_months as number | null | undefined,
          selling_entity_type: item.selling_entity_type as string | null | undefined,
          selling_entity_legal_name: item.selling_entity_legal_name as string | null | undefined,
          cac_rc_number: item.cac_rc_number as string | null | undefined,
          power_supply: item.power_supply as string | null | undefined,
          water_supply: item.water_supply as string | null | undefined,
          sewage: item.sewage as string | null | undefined,
          road_access: item.road_access as string | null | undefined,
          is_estate_unit: item.is_estate_unit as boolean | null | undefined,
          estate_name: item.estate_name as string | null | undefined,
          built_up_area_sqm: item.built_up_area_sqm as number | null | undefined,
          declared_plot_size_sqm: item.declared_plot_size_sqm as number | null | undefined,
          units_available: item.units_available as number | null | undefined,
          year_built: item.year_built as number | null | undefined,
          latitude: item.latitude as number | null | undefined,
          longitude: item.longitude as number | null | undefined,
          cadastral_zone: item.cadastral_zone as string | null | undefined,
          plot_number: item.plot_number as string | null | undefined,
          polygon_geojson: item.polygon_geojson as string | null | undefined,
          title_type: item.title_type as string | null | undefined,
          title_file_no: item.title_file_no as string | null | undefined,
          title_holder_name: item.title_holder_name as string | null | undefined,
          title_issued_date: item.title_issued_date as string | null | undefined,
          title_issuing_authority: item.title_issuing_authority as string | null | undefined,
          featured: item.featured as boolean | undefined,
          verification_status: (item.verification_status || (item.verified ? 'verified' : 'draft')) as string | undefined,
          agency_name: (item.agency_name || item.agent) as string | undefined,
          agency_id: item.agency_id as string | undefined,
          created_at: item.created_at as string | undefined,
          updated_at: item.updated_at as string | undefined,
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

  const toggleFeatured = async (l: AdminListing) => {
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

  const upsertListingRow = useCallback((updated: AdminListing) => {
    setListings(prev => prev?.map(x => x.id === updated.id ? { ...x, ...updated } : x) ?? null)
  }, [])

  const handleSaved = (updated: AdminListing) => {
    upsertListingRow(updated)
    setEditTarget(null)
  }

  useEffect(() => {
    if (!rewriteSavedToast) return
    const t = setTimeout(() => setRewriteSavedToast(false), 4200)
    return () => clearTimeout(t)
  }, [rewriteSavedToast])

  const deleteListing = async (l: AdminListing) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await be.send(`/listings/${l.id}`, 'DELETE', undefined)
      setListings(prev => prev?.filter(x => x.id !== l.id) ?? null)
      setTotal(t => Math.max(0, t - 1))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const toggleDraft = async (l: AdminListing) => {
    const next = l.verification_status === 'draft' ? 'submitted' : 'draft'
    setToggling(l.id)
    try {
      await be.send(`/listings/${l.id}`, 'PATCH', { verification_status: next })
      setListings(prev => prev?.map(x => x.id === l.id ? { ...x, verification_status: next } : x) ?? null)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setToggling(null)
    }
  }

  // HTML5 drag-to-reorder. We track the dragged index in a ref so the row
  // doesn't re-render on every dragover, then persist the new order on drop.
  const dragIndex = useRef<number | null>(null)
  const onRowDragStart = (i: number) => { dragIndex.current = i }
  const onRowDragOver = (e: React.DragEvent) => e.preventDefault()
  const onRowDrop = async (i: number) => {
    const from = dragIndex.current
    dragIndex.current = null
    if (from === null || from === i || !listings) return
    const next = [...listings]
    const [moved] = next.splice(from, 1)
    next.splice(i, 0, moved)
    setListings(next)
    try {
      await be.send('/listings/order', 'PATCH', { ids: next.map(x => x.id) })
    } catch (e) {
      alert((e as Error).message)
    }
  }

  if (error) return <PageError message={error} />

  return (
    <>
      {rewriteSavedToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 px-4 py-2.5 rounded-button bg-navy text-white text-body-sm font-semibold shadow-lg animate-fade-up"
        >
          Rewrite saved to the listing.
        </div>
      )}
      {/* Edit drawer */}
      {editTarget && (
        <EditDrawer
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Rewrite drawer */}
      {rewriteTarget && (
        <RewriteDrawer
          listing={rewriteTarget}
          onClose={() => setRewriteTarget(null)}
          onApplied={(updated) => {
            upsertListingRow(updated)
            setRewriteSavedToast(true)
            setRewriteTarget(null)
          }}
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
                className={`px-3 py-1.5 rounded-badge text-caption font-semibold capitalize transition-all duration-150 ${statusFilter === s
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
                  <th className="px-2 py-3 w-8" />
                  <th className="px-5 py-3 w-12" />
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3 hidden md:table-cell">Agency</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Type</th>
                  <th className="px-5 py-3 hidden xl:table-cell">Units</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {listings.map((l, idx) => (
                  <tr
                    key={l.id}
                    draggable
                    onDragStart={() => onRowDragStart(idx)}
                    onDragOver={onRowDragOver}
                    onDrop={() => onRowDrop(idx)}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    {/* Drag handle */}
                    <td className="px-2 py-3 cursor-grab text-divider hover:text-subtle">
                      <GripVertical size={14} strokeWidth={2} />
                    </td>
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
                      {l.construction_status && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-badge bg-beige border border-divider text-[10px] font-semibold text-subtle capitalize">
                          {l.construction_status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>

                    {/* Units available */}
                    <td className="px-5 py-3 hidden xl:table-cell">
                      {l.units_available != null
                        ? <p className="text-body-sm text-navy font-semibold">{l.units_available}</p>
                        : <p className="text-caption text-subtle">—</p>}
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
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-button text-caption font-semibold transition-all duration-150 disabled:opacity-50 ${l.featured
                            ? 'bg-gold/20 text-amber-700 hover:bg-gold/30'
                            : 'bg-beige text-subtle hover:bg-beige/70 hover:text-navy'
                            }`}
                        >
                          {l.featured
                            ? <StarOff size={12} strokeWidth={2} />
                            : <Star size={12} strokeWidth={2} />}
                          <span className="hidden sm:inline">{l.featured ? 'Unfeature' : 'Feature'}</span>
                        </button>

                        {/* Draft / Publish toggle */}
                        <button
                          onClick={() => toggleDraft(l)}
                          disabled={togglingId === l.id}
                          title={l.verification_status === 'draft' ? 'Publish (move to submitted)' : 'Move to draft'}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-beige text-subtle hover:bg-divider/50 hover:text-navy text-caption font-semibold transition-all duration-150 disabled:opacity-50"
                        >
                          {l.verification_status === 'draft'
                            ? <><Send size={12} strokeWidth={2} /><span className="hidden sm:inline">Publish</span></>
                            : <><FileText size={12} strokeWidth={2} /><span className="hidden sm:inline">Draft</span></>}
                        </button>

                        {/* AI Rewrite */}
                        <button
                          onClick={() => setRewriteTarget(l)}
                          title="Rewrite with AI"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-action-light text-action hover:bg-action hover:text-white text-caption font-semibold transition-all duration-150"
                        >
                          <Sparkles size={12} strokeWidth={2} />
                          <span className="hidden sm:inline">Rewrite</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(l)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-action-light text-action hover:bg-action hover:text-white text-caption font-semibold transition-all duration-150"
                        >
                          <Pencil size={12} strokeWidth={2} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteListing(l)}
                          title="Delete listing"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-button bg-beige text-subtle hover:bg-danger hover:text-white text-caption font-semibold transition-all duration-150"
                        >
                          <Trash2 size={12} strokeWidth={2} />
                        </button>

                        {/* View on site */}
                        {l.slug && (
                          <a
                            href={`https://propabridge.com/properties-details/${l.slug}`}
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
