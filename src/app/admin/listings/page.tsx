'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  Building2,
  RefreshCw,
  Star,
  StarOff,
  ExternalLink,
  Home,
} from 'lucide-react'
import { adk } from '@/lib/client-api'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface AdkListing {
  id: string
  title?: string
  description?: string
  city?: string
  bedrooms?: number
  bathrooms?: number
  price?: number
  listing_type?: string
  property_type?: string
  size_sqm?: number
  cover_image_url?: string
  slug?: string
  featured?: boolean
  year_built?: string
  created_at?: string
  updated_at?: string
  previous_price?: number
}

function formatPrice(n?: number) {
  if (!n) return '—'
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n}`
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdkListing[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = () => {
    setError(null)
    adk
      .get<{ properties: AdkListing[] }>('/listings')
      .then((d) => setListings(d.properties || []))
      .catch((e) => setError((e as Error).message))
  }

  useEffect(() => { load() }, [])

  const syncFramer = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await adk.send<{ synced?: number; message?: string }>(
        '/listings/sync-framer',
        'POST',
      )
      setSyncMsg(`Synced ${res.synced ?? 0} listings from Framer CMS.`)
      load()
    } catch (e) {
      setSyncMsg((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  const toggleFeatured = async (listing: AdkListing) => {
    setTogglingId(listing.id)
    try {
      await adk.send(`/listings/${listing.id}`, 'PUT', {
        featured: !listing.featured,
      })
      load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setTogglingId(null)
    }
  }

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h3 text-navy">Listings</h1>
          <p className="text-body-sm text-subtle mt-0.5">
            {listings === null ? '…' : `${listings.length} properties`} managed
            by the ADK
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMsg && (
            <span className="text-caption text-subtle bg-beige border border-divider px-3 py-1.5 rounded-badge">
              {syncMsg}
            </span>
          )}
          <button
            onClick={syncFramer}
            disabled={syncing}
            className="flex items-center gap-2 bg-action hover:bg-action-hover text-white font-semibold px-5 py-2.5 rounded-button transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={14} strokeWidth={2} className={syncing ? 'animate-spin' : ''} />
            Sync Framer CMS
          </button>
        </div>
      </div>

      {listings === null ? (
        <PageLoading />
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-card border border-divider shadow-card p-20 text-center text-subtle">
          <Home size={48} strokeWidth={1.2} className="mx-auto text-divider mb-4" />
          <p className="text-body-sm">No listings found. Try syncing from Framer CMS.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-card border border-divider shadow-card overflow-hidden flex flex-col"
            >
              {/* Image */}
              <div className="relative h-44 bg-beige flex-shrink-0">
                {l.cover_image_url ? (
                  <Image
                    src={l.cover_image_url}
                    alt={l.title || 'Listing'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={40} strokeWidth={1.2} className="text-divider" />
                  </div>
                )}
                {/* Featured badge */}
                {l.featured && (
                  <span className="absolute top-3 left-3 bg-gold text-navy text-[10px] font-bold px-2.5 py-1 rounded-badge">
                    FEATURED
                  </span>
                )}
                {/* Type pill */}
                <span className="absolute top-3 right-3 bg-navy text-white text-[10px] font-bold px-2.5 py-1 rounded-badge uppercase">
                  {l.listing_type || 'sale'}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-semibold text-navy text-body-sm leading-snug line-clamp-2 mb-1">
                  {l.title || 'Untitled Listing'}
                </p>
                <p className="text-caption text-subtle mb-3">
                  {[l.city, l.property_type].filter(Boolean).join(' · ') || '—'}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-caption bg-beige rounded-lg p-2 mb-4">
                  <div>
                    <p className="font-bold text-navy">{l.bedrooms ?? '—'}</p>
                    <p className="text-subtle">Beds</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy">{l.bathrooms ?? '—'}</p>
                    <p className="text-subtle">Baths</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy">
                      {l.size_sqm ? `${l.size_sqm}` : '—'}
                    </p>
                    <p className="text-subtle">sqm</p>
                  </div>
                </div>

                <p className="text-h4 text-action font-bold mb-4">
                  {formatPrice(l.price)}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => toggleFeatured(l)}
                    disabled={togglingId === l.id}
                    title={l.featured ? 'Remove from featured' : 'Mark as featured'}
                    className={`flex items-center gap-1.5 text-caption font-semibold px-3 py-2 rounded-button transition-all duration-150 disabled:opacity-50 ${
                      l.featured
                        ? 'bg-gold/20 text-gold hover:bg-gold/30'
                        : 'bg-beige text-subtle hover:bg-beige/80 hover:text-navy'
                    }`}
                  >
                    {l.featured ? (
                      <StarOff size={13} strokeWidth={2} />
                    ) : (
                      <Star size={13} strokeWidth={2} />
                    )}
                    {l.featured ? 'Unfeature' : 'Feature'}
                  </button>

                  {l.slug && (
                    <a
                      href={`https://propabridge.com/properties/${l.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-caption text-action hover:text-action-hover font-semibold"
                    >
                      View <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
