'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { be } from '@/lib/client-api'
import { AdminListing } from '@/lib/types'
import { ListingEditForm } from '@/components/admin/ListingEditForm'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import { normalizeListingType } from '@/lib/listing-type'

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [listing, setListing] = useState<AdminListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await be.get<any>(`/listings/${encodeURIComponent(params.id)}`)
      
      // Backend returns { success, data: { ... } } or just the listing object
      const raw = data.listing || data.data || data
      
      const item: AdminListing = {
        id: String(raw.id ?? ''),
        title: raw.title as string | undefined,
        slug: raw.slug as string | undefined,
        city: raw.city as string | undefined,
        listing_type: normalizeListingType(
          (raw.listing_type || raw.transaction_type) as string | undefined,
        ),
        property_type: (raw.property_type || raw.type) as string | undefined,
        bedrooms: raw.bedrooms as number | null | undefined,
        bathrooms: raw.bathrooms as number | null | undefined,
        size_sqm: raw.size_sqm as number | null | undefined,
        price: raw.price as number | null | undefined,
        previous_price: raw.previous_price as number | null | undefined,
        cover_image_url: (raw.cover_image_url || (Array.isArray(raw.images) ? raw.images[0] : null)) as string | null | undefined,
        images: (Array.isArray(raw.images) ? raw.images : []) as string[],
        amenities: (Array.isArray(raw.amenities) ? raw.amenities : []) as string[],
        construction_status: raw.construction_status as string | null | undefined,
        condition: raw.condition as string | null | undefined,
        intent: raw.intent as string | null | undefined,
        description: raw.description as string | null | undefined,
        neighborhood: raw.neighborhood as string | null | undefined,
        address: raw.address as string | null | undefined,
        payment_plan: raw.payment_plan as string | null | undefined,
        service_charge_ngn_per_year: raw.service_charge_ngn_per_year as number | null | undefined,
        propabridge_commission_pct: raw.propabridge_commission_pct as number | null | undefined,
        attribution_window_months: raw.attribution_window_months as number | null | undefined,
        selling_entity_type: raw.selling_entity_type as string | null | undefined,
        selling_entity_legal_name: raw.selling_entity_legal_name as string | null | undefined,
        cac_rc_number: raw.cac_rc_number as string | null | undefined,
        power_supply: raw.power_supply as string | null | undefined,
        water_supply: raw.water_supply as string | null | undefined,
        sewage: raw.sewage as string | null | undefined,
        road_access: raw.road_access as string | null | undefined,
        is_estate_unit: raw.is_estate_unit as boolean | null | undefined,
        estate_name: raw.estate_name as string | null | undefined,
        built_up_area_sqm: raw.built_up_area_sqm as number | null | undefined,
        declared_plot_size_sqm: raw.declared_plot_size_sqm as number | null | undefined,
        units_available: raw.units_available as number | null | undefined,
        year_built: raw.year_built as number | null | undefined,
        latitude: raw.latitude as number | null | undefined,
        longitude: raw.longitude as number | null | undefined,
        cadastral_zone: raw.cadastral_zone as string | null | undefined,
        plot_number: raw.plot_number as string | null | undefined,
        polygon_geojson: raw.polygon_geojson as string | null | undefined,
        title_type: raw.title_type as string | null | undefined,
        title_file_no: raw.title_file_no as string | null | undefined,
        title_holder_name: raw.title_holder_name as string | null | undefined,
        title_issued_date: raw.title_issued_date as string | null | undefined,
        title_issuing_authority: raw.title_issuing_authority as string | null | undefined,
        featured: raw.featured as boolean | undefined,
        verification_status: (raw.verification_status || (raw.verified ? 'verified' : 'draft')) as string | undefined,
        agency_name: (raw.agency_name || raw.agent) as string | undefined,
        agency_id: raw.agency_id as string | undefined,
        created_at: raw.created_at as string | undefined,
        updated_at: raw.updated_at as string | undefined,
      }
      setListing(item)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = () => {
    router.push('/admin/listings')
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) return <PageLoading />
  if (error) return <PageError message={error} />
  if (!listing) return <PageError message="Listing not found" />

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-beige rounded-full transition-colors"
            title="Go back"
          >
            <ArrowLeft size={20} className="text-subtle" />
          </button>
          <div>
            <h1 className="text-h3 text-navy font-bold">Edit Listing</h1>
            <p className="text-caption text-subtle mt-0.5">
              ID: <code className="bg-beige px-1 rounded">{listing.id}</code>
            </p>
          </div>
        </div>
        <Link
          href={`/admin/listings?focus=${listing.id}`}
          className="text-caption text-action hover:underline font-semibold"
        >
          View in list
        </Link>
      </div>

      <div className="bg-white rounded-card border border-divider shadow-card overflow-hidden h-[80vh]">
        <ListingEditForm
          listing={listing}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
