'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { agency } from '@/lib/agency-api'
import { formatNaira } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Listing {
  id: string
  title?: string
  price?: number
  location?: string
  description?: string
  status?: string
  bedrooms?: number | string
  bathrooms?: number | string
  images?: string[]
  amenities?: string[]
  city?: string
  neighbourhood?: string
  verification_status?: 'draft' | 'submitted' | 'in_review' | 'verified' | 'rejected' | 'needs_info'
}

const COSMETIC_FIELDS = new Set(['description', 'images', 'amenities', 'status'])

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    price: '',
    location: '',
    description: '',
    status: 'pending',
    bedrooms: '',
    bathrooms: '',
    images: [] as string[],
    amenities: '' as string,
  })

  useEffect(() => {
    agency
      .get<{ items?: Listing[] } | Listing>(`/listings?limit=200`)
      .then((v) => {
        const items = Array.isArray(v) ? v : (v as { items?: Listing[] }).items || []
        const found = items.find((l) => l.id === id)
        if (!found) throw new Error('Listing not found')
        setListing(found)
        setForm({
          title: found.title || '',
          price: found.price ? String(found.price) : '',
          location: found.location || '',
          description: found.description || '',
          status: found.status || 'pending',
          bedrooms: found.bedrooms != null ? String(found.bedrooms) : '',
          bathrooms: found.bathrooms != null ? String(found.bathrooms) : '',
          images: found.images || [],
          amenities: Array.isArray(found.amenities) ? found.amenities.join(', ') : '',
        })
      })
      .catch((e) => setError((e as Error).message))
  }, [id])

  // What the user is about to change vs what's saved. Used to (a) decide
  // whether to surface the verification-reset warning, and (b) skip sending
  // unchanged fields to the backend.
  const diffMaterial = (): boolean => {
    if (!listing) return false
    const changed: Record<string, boolean> = {
      title: form.title !== (listing.title || ''),
      price: form.price !== (listing.price != null ? String(listing.price) : ''),
      location: form.location !== (listing.location || ''),
      bedrooms: form.bedrooms !== (listing.bedrooms != null ? String(listing.bedrooms) : ''),
      bathrooms: form.bathrooms !== (listing.bathrooms != null ? String(listing.bathrooms) : ''),
    }
    return Object.entries(changed).some(([k, v]) => v && !COSMETIC_FIELDS.has(k))
  }

  const willResetVerification = listing?.verification_status === 'verified' && diffMaterial()

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (willResetVerification) {
      const ok = confirm(
        'This listing is currently Verified. The fields you changed will return ' +
          'it to the verification queue and our team will re-review it before it ' +
          'goes back live to buyers.\n\nProceed?',
      )
      if (!ok) return
    }

    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        title: form.title || undefined,
        price: form.price ? Number(form.price) : undefined,
        location: form.location || undefined,
        description: form.description || undefined,
        status: form.status,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        images: form.images.length > 0 ? form.images : undefined,
        amenities: form.amenities.trim()
          ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      }
      const resp = await agency.send<{
        listing: Listing
        verification_reset?: boolean
      }>(`/listings/${encodeURIComponent(id)}`, 'PATCH', body)
      setSaved(true)
      if (resp?.listing) setListing(resp.listing)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (error && !listing) return <PageError message={error} />
  if (!listing) return <PageLoading />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/agency/listings')}
          className="p-2 rounded-button text-subtle hover:text-navy hover:bg-beige"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-h4 text-navy">Edit listing</h1>
          <p className="text-caption text-subtle">
            {listing.title || `Listing ${id}`} · {formatNaira(listing.price || 0)}
          </p>
        </div>
      </div>

      {/* Verification banner — Verified listings get a clear contract:
          editing material fields drops them back into the queue. */}
      {listing.verification_status === 'verified' && (
        <div className="flex items-start gap-3 p-4 rounded-card bg-verified-light/40 border border-verified/20">
          <ShieldCheck size={20} className="text-verified flex-shrink-0 mt-0.5" />
          <div className="text-body-sm">
            <p className="font-semibold text-navy">This listing is verified.</p>
            <p className="text-subtle mt-1">
              Cosmetic edits (description, photos, amenities) keep the badge.
              Changing the title, price, location, or bedroom count returns it
              to the verification queue for re-review.
            </p>
          </div>
        </div>
      )}
      {willResetVerification && (
        <div className="flex items-start gap-3 p-4 rounded-card bg-warning-light/50 border border-warning/30">
          <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-body-sm text-navy">
            Saving these changes will move this listing back to <strong>Submitted</strong>.
          </p>
        </div>
      )}
      {saved && (
        <div className="flex items-start gap-3 p-4 rounded-card bg-verified-light/40 border border-verified/20">
          <ShieldCheck size={20} className="text-verified flex-shrink-0 mt-0.5" />
          <p className="text-body-sm text-navy">
            Saved.
            {listing.verification_status !== 'verified' && ' Reviewer will pick it up.'}
          </p>
        </div>
      )}

      <form onSubmit={onSave} className="bg-white rounded-card border border-divider shadow-card p-6 sm:p-8 space-y-5">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Price (₦)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <div>
            <label className="block text-nav font-medium text-navy mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
          <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
        </div>

        <div>
          <label className="block text-nav font-medium text-navy mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-nav font-medium text-navy mb-2">Photos</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative group rounded-input overflow-hidden border border-divider aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 bg-navy/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <label className={`flex flex-col items-center justify-center rounded-input border-2 border-dashed aspect-[4/3] cursor-pointer transition-colors ${uploading ? 'border-action bg-action-light/20 opacity-60' : 'border-divider hover:border-action hover:bg-beige/30'}`}>
              <Upload size={20} className="text-subtle mb-1" strokeWidth={1.5} />
              <span className="text-caption text-subtle">{uploading ? 'Uploading…' : 'Add photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    const { url } = await agency.uploadImage(file)
                    setForm((f) => ({ ...f, images: [...f.images, url] }))
                  } catch (err) {
                    setError((err as Error).message)
                  } finally {
                    setUploading(false)
                    e.target.value = ''
                  }
                }}
              />
            </label>
          </div>
        </div>

        <Input
          label="Amenities (comma-separated)"
          value={form.amenities}
          onChange={(e) => setForm({ ...form, amenities: e.target.value })}
          placeholder="Swimming pool, gym, parking"
        />

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-input bg-danger-light/50 border border-danger/20">
            <p className="text-body-sm text-danger">{error}</p>
          </div>
        )}
        {saved && (
          <div className="flex items-start gap-2 p-3 rounded-input bg-verified-light/50 border border-verified/20">
            <p className="text-body-sm text-verified">Changes saved.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={saving}>
            <Save size={14} /> Save changes
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/agency/listings')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
