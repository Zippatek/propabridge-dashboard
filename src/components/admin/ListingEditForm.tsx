'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Send, FileText, Check } from 'lucide-react'
import { be } from '@/lib/client-api'
import { LISTING_TYPES_DB, normalizeListingType } from '@/lib/listing-type'
import { AdminListing } from '@/lib/types'
import { ListingImageManager, ImageItem } from './ListingImageManager'
import { ListingPlanUpload } from './ListingPlanUpload'
import { TitleDocumentManager } from './TitleDocumentManager'
import { NeighborhoodPicker } from './NeighborhoodPicker'

interface ListingEditFormProps {
  listing: AdminListing
  onSaved: (updated: AdminListing) => void
  onCancel: () => void
  /** Keeps the table row in sync when the floor plan is uploaded/removed without closing the drawer. */
  onPlanPatch?: (patch: Partial<AdminListing>) => void
}

const VERIFY_STATUSES = ['draft', 'submitted', 'in_review', 'needs_info', 'verified', 'rejected']
const CONSTRUCTION_STATUS_OPTS = [
  ['', '—'],
  ['finished', 'Finished'],
  ['semi_finished', 'Semi-finished'],
  ['under_construction', 'Under construction'],
  ['off_plan', 'Off-plan'],
  ['plots', 'Plots / land'],
] as const

function formatPrice(n?: number | null) {
  if (!n) return '—'
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`
  return `₦${n}`
}

export function ListingEditForm({ listing, onSaved, onCancel, onPlanPatch }: ListingEditFormProps) {
  const initialImages: ImageItem[] = (() => {
    const arr = Array.isArray(listing.images) ? listing.images : []
    if (arr.length === 0 && listing.cover_image_url) return [{ url: listing.cover_image_url, is_cover: true }]
    return arr.map((url, i) => ({
      url,
      is_cover: listing.cover_image_url ? url === listing.cover_image_url : i === 0,
    }))
  })()

  const [form, setForm] = useState({
    title: listing.title || '',
    description: listing.description || '',
    city: listing.city || '',
    neighborhood: listing.neighborhood || '',
    address: listing.address || '',
    price: listing.price ? String(listing.price) : '',
    listing_type: normalizeListingType(listing.listing_type),
    property_type: listing.property_type || 'apartment',
    intent: listing.intent || '',
    bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : '',
    bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : '',
    size_sqm: listing.size_sqm != null ? String(listing.size_sqm) : '',
    built_up_area_sqm: listing.built_up_area_sqm != null ? String(listing.built_up_area_sqm) : '',
    declared_plot_size_sqm: listing.declared_plot_size_sqm != null ? String(listing.declared_plot_size_sqm) : '',
    slug: listing.slug || '',
    featured: listing.featured || false,
    verification_status: listing.verification_status || 'draft',
    payment_plan: listing.payment_plan || '',
    service_charge_ngn_per_year: listing.service_charge_ngn_per_year != null ? String(listing.service_charge_ngn_per_year) : '',
    propabridge_commission_pct: listing.propabridge_commission_pct != null ? String(listing.propabridge_commission_pct) : '',
    attribution_window_months: listing.attribution_window_months != null ? String(listing.attribution_window_months) : '',
    selling_entity_type: listing.selling_entity_type || '',
    selling_entity_legal_name: listing.selling_entity_legal_name || '',
    cac_rc_number: listing.cac_rc_number || '',
    power_supply: listing.power_supply || '',
    water_supply: listing.water_supply || '',
    sewage: listing.sewage || '',
    road_access: listing.road_access || '',
    construction_status: listing.construction_status || '',
    condition: listing.condition || '',
    is_estate_unit: !!listing.is_estate_unit,
    estate_name: listing.estate_name || '',
    amenities: Array.isArray(listing.amenities) ? listing.amenities.join(', ') : '',
    units_available: listing.units_available != null ? String(listing.units_available) : '',
    year_built: listing.year_built != null ? String(listing.year_built) : '',
    latitude: listing.latitude != null ? String(listing.latitude) : '',
    longitude: listing.longitude != null ? String(listing.longitude) : '',
    cadastral_zone: listing.cadastral_zone || '',
    plot_number: listing.plot_number || '',
    polygon_geojson: listing.polygon_geojson || '',
    title_type: listing.title_type || '',
    title_file_no: listing.title_file_no || '',
    title_holder_name: listing.title_holder_name || '',
    title_issued_date: listing.title_issued_date || '',
    title_issuing_authority: listing.title_issuing_authority || '',
    video_url: listing.video_url || '',
  })
  const [images, setImages] = useState<ImageItem[]>(initialImages)
  const [plan, setPlan] = useState<{ url: string | null; fileName: string | null }>({
    url: listing.plan_url ?? null,
    fileName: listing.plan_file_name ?? null,
  })
  const [titleDocs, setTitleDocs] = useState<string[]>(listing.title_documents ?? [])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['apartment', 'house', 'duplex', 'bungalow', 'land', 'commercial', 'villa', 'penthouse'])

  useEffect(() => {
    be.get<any>('/listings/filters').then(res => {
      const raw = res?.data || res || []
      if (Array.isArray(raw)) {
        setPropertyTypes(raw.map((t: any) => t.slug))
      }
    }).catch(console.error)
  }, [])

  useEffect(() => {
    setPlan({
      url: listing.plan_url ?? null,
      fileName: listing.plan_file_name ?? null,
    })
  }, [listing.id, listing.plan_url, listing.plan_file_name])

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      const videoUrlClean = form.video_url?.trim() || ''
      if (videoUrlClean) {
        try {
          const parsed = new URL(videoUrlClean)
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error()
          }
        } catch {
          setErr('Video URL must be a valid URL starting with http:// or https://')
          setSaving(false)
          return
        }
      }
      const payload: Record<string, unknown> = {
        title: form.title || undefined,
        description: form.description || undefined,
        city: form.city || undefined,
        neighborhood: form.neighborhood || undefined,
        address: form.address || undefined,
        slug: form.slug || undefined,
        listing_type: normalizeListingType(form.listing_type),
        property_type: form.property_type,
        intent: form.intent || undefined,
        featured: form.featured,
        verification_status: form.verification_status,
        payment_plan: form.payment_plan || undefined,
        selling_entity_type: form.selling_entity_type || undefined,
        selling_entity_legal_name: form.selling_entity_legal_name || undefined,
        cac_rc_number: form.cac_rc_number || undefined,
        power_supply: form.power_supply || undefined,
        water_supply: form.water_supply || undefined,
        sewage: form.sewage || undefined,
        road_access: form.road_access || undefined,
        construction_status: form.construction_status || undefined,
        condition: form.condition || undefined,
        is_estate_unit: form.is_estate_unit,
        estate_name: form.is_estate_unit ? (form.estate_name || undefined) : undefined,
        price: num(form.price),
        bedrooms: num(form.bedrooms),
        bathrooms: num(form.bathrooms),
        size_sqm: num(form.size_sqm),
        built_up_area_sqm: num(form.built_up_area_sqm),
        declared_plot_size_sqm: num(form.declared_plot_size_sqm),
        service_charge_ngn_per_year: num(form.service_charge_ngn_per_year),
        propabridge_commission_pct: num(form.propabridge_commission_pct),
        attribution_window_months: num(form.attribution_window_months),
        latitude: num(form.latitude),
        longitude: num(form.longitude),
        cadastral_zone: form.cadastral_zone || undefined,
        plot_number: form.plot_number || undefined,
        polygon_geojson: (form.polygon_geojson as string)?.trim() || undefined,
        title_type: form.title_type || undefined,
        title_file_no: form.title_file_no || undefined,
        title_holder_name: form.title_holder_name || undefined,
        title_issued_date: form.title_issued_date || undefined,
        title_issuing_authority: form.title_issuing_authority || undefined,
        title_documents: titleDocs.length > 0 ? titleDocs : undefined,
        amenities: form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        units_available: num(form.units_available as string),
        year_built: num(form.year_built as string),
        plan_url: plan.url,
        plan_file_name: plan.fileName,
        video_url: videoUrlClean || null,
      }
      for (const k of Object.keys(payload)) {
        if (payload[k] === undefined || (payload[k] === null && k !== 'video_url')) delete payload[k]
      }
      const res = await be.send<any>(`/listings/${listing.id}`, 'PATCH', payload)
      const updatedData = res?.data || res?.item || res || {}

      onSaved({
        ...listing,
        ...payload,
        ...updatedData,
        images: images.map(i => i.url),
        cover_image_url: (images.find(i => i.is_cover) || images[0])?.url ?? null,
        plan_url: plan.url,
        plan_file_name: plan.fileName,
        video_url: videoUrlClean || null,
      })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleDraft = async () => {
    const nextStatus = form.verification_status === 'draft' ? 'submitted' : 'draft'
    set('verification_status', nextStatus)
    try {
      const updated = await be.send<AdminListing>(`/listings/${listing.id}`, 'PATCH', {
        verification_status: nextStatus,
      })
      onSaved({ ...listing, ...updated, verification_status: nextStatus })
    } catch (e) {
      setErr((e as Error).message)
      set('verification_status', form.verification_status)
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'

  const selectCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 appearance-none'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <ListingImageManager listingId={listing.id} initial={images} onPersisted={setImages} />

        <ListingPlanUpload
          listingId={listing.id}
          planUrl={plan.url}
          planFileName={plan.fileName}
          onPersisted={(next) => {
            setPlan(next)
            onPlanPatch?.({ plan_url: next.url, plan_file_name: next.fileName })
          }}
        />

        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Property Video URL</span>
          <input
            className={inputCls}
            value={form.video_url}
            onChange={e => set('video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
        </label>

        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Title</span>
          <input
            className={inputCls}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Listing title"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">City</span>
            <input
              className={inputCls}
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="e.g. Abuja"
            />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Slug</span>
            <input
              className={inputCls}
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              placeholder="url-slug"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NeighborhoodPicker
            value={form.neighborhood}
            onChange={(name) => set('neighborhood', name)}
            onCitySuggestion={(c) => { if (!form.city?.trim()) set('city', c) }}
            cityHint={form.city}
            inputCls={inputCls}
          />
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Address</span>
            <input
              className={inputCls}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Plot / street"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Latitude</span>
            <input
              className={inputCls}
              value={form.latitude}
              onChange={e => set('latitude', e.target.value)}
              placeholder="e.g. 9.0765"
            />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Longitude</span>
            <input
              className={inputCls}
              value={form.longitude}
              onChange={e => set('longitude', e.target.value)}
              placeholder="e.g. 7.3986"
            />
          </label>
        </div>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Advanced location</summary>
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Cadastral Zone</span>
                <input
                  className={inputCls}
                  value={form.cadastral_zone}
                  onChange={e => set('cadastral_zone', e.target.value)}
                  placeholder="e.g. B09"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Plot Number</span>
                <input
                  className={inputCls}
                  value={form.plot_number}
                  onChange={e => set('plot_number', e.target.value)}
                  placeholder="e.g. 1234"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Polygon GeoJSON</span>
              <textarea
                className={`${inputCls} font-mono resize-none`}
                rows={3}
                value={form.polygon_geojson}
                onChange={e => set('polygon_geojson', e.target.value)}
                placeholder='{"type":"Polygon","coordinates":[[...]]}'
              />
            </label>
          </div>
        </details>

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
          {form.price && <p className="text-[11px] text-action mt-1">{formatPrice(Number(form.price))}</p>}
        </label>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Title & Legal</summary>
          <div className="pt-3 space-y-3">
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Title Type</span>
              <div className="relative">
                <select className={selectCls} value={form.title_type} onChange={e => set('title_type', e.target.value)}>
                  {TITLE_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                />
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Title File No.</span>
                <input
                  className={inputCls}
                  value={form.title_file_no}
                  onChange={e => set('title_file_no', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Title Issued Date</span>
                <input
                  className={inputCls}
                  type="date"
                  value={form.title_issued_date}
                  onChange={e => set('title_issued_date', e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Title Holder Name</span>
              <input
                className={inputCls}
                value={form.title_holder_name}
                onChange={e => set('title_holder_name', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Issuing Authority</span>
              <input
                className={inputCls}
                value={form.title_issuing_authority}
                onChange={e => set('title_issuing_authority', e.target.value)}
              />
            </label>
            <TitleDocumentManager
              listingId={listing.id}
              initial={titleDocs}
              onChange={setTitleDocs}
              titleSnapshot={{
                title_type: form.title_type,
                title_file_no: form.title_file_no,
                title_holder_name: form.title_holder_name,
                title_issuing_authority: form.title_issuing_authority,
                title_issued_date: form.title_issued_date,
              }}
            />
          </div>
        </details>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Listing type</span>
            <div className="relative">
              <select className={selectCls} value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
                {LISTING_TYPES_DB.map(t => (
                  <option key={t} value={t}>
                    {t === 'sale' ? 'Sale' : 'Rent'}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Property type</span>
            <div className="relative">
              <select
                className={selectCls}
                value={form.property_type}
                onChange={e => set('property_type', e.target.value)}
              >
                {propertyTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Beds</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.bedrooms}
              onChange={e => set('bedrooms', e.target.value)}
              placeholder="—"
            />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Baths</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.bathrooms}
              onChange={e => set('bathrooms', e.target.value)}
              placeholder="—"
            />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">sqm</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={form.size_sqm}
              onChange={e => set('size_sqm', e.target.value)}
              placeholder="—"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Verification status</span>
          <div className="relative">
            <select
              className={selectCls}
              value={form.verification_status}
              onChange={e => set('verification_status', e.target.value)}
            >
              {VERIFY_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Construction status</span>
            <div className="relative">
              <select
                className={selectCls}
                value={form.construction_status}
                onChange={e => set('construction_status', e.target.value)}
              >
                {CONSTRUCTION_STATUS_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Year built</span>
            <input
              className={inputCls}
              type="number"
              value={form.year_built}
              onChange={e => set('year_built', e.target.value)}
              placeholder="e.g. 2024"
            />
          </label>
        </div>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Pricing & Terms</summary>
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Payment plan</span>
                <input
                  className={inputCls}
                  value={form.payment_plan}
                  onChange={e => set('payment_plan', e.target.value)}
                  placeholder="outright / installment…"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Service charge (₦/yr)</span>
                <input
                  className={inputCls}
                  type="number"
                  value={form.service_charge_ngn_per_year}
                  onChange={e => set('service_charge_ngn_per_year', e.target.value)}
                  placeholder="0"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Commission (%)</span>
                <input
                  className={inputCls}
                  type="number"
                  value={form.propabridge_commission_pct}
                  onChange={e => set('propabridge_commission_pct', e.target.value)}
                  placeholder="5"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Attribution (months)</span>
                <input
                  className={inputCls}
                  type="number"
                  value={form.attribution_window_months}
                  onChange={e => set('attribution_window_months', e.target.value)}
                  placeholder="12"
                />
              </label>
            </div>
          </div>
        </details>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Seller</summary>
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Selling entity type</span>
                <input
                  className={inputCls}
                  value={form.selling_entity_type}
                  onChange={e => set('selling_entity_type', e.target.value)}
                  placeholder="developer / agent…"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">CAC RC #</span>
                <input
                  className={inputCls}
                  value={form.cac_rc_number}
                  onChange={e => set('cac_rc_number', e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Selling entity legal name</span>
              <input
                className={inputCls}
                value={form.selling_entity_legal_name}
                onChange={e => set('selling_entity_legal_name', e.target.value)}
              />
            </label>
          </div>
        </details>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Utilities & Condition</summary>
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Power</span>
                <input
                  className={inputCls}
                  value={form.power_supply}
                  onChange={e => set('power_supply', e.target.value)}
                  placeholder="grid / solar…"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Water</span>
                <input
                  className={inputCls}
                  value={form.water_supply}
                  onChange={e => set('water_supply', e.target.value)}
                  placeholder="mains / borehole…"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Sewage</span>
                <input className={inputCls} value={form.sewage} onChange={e => set('sewage', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1.5 block">Road access</span>
                <input className={inputCls} value={form.road_access} onChange={e => set('road_access', e.target.value)} />
              </label>
            </div>
          </div>
        </details>

        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Amenities & Narrative</summary>
          <div className="pt-3 space-y-3">
            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1.5 block">Amenities (comma-separated)</span>
              <input
                className={inputCls}
                value={form.amenities}
                onChange={e => set('amenities', e.target.value)}
                placeholder="Pool, Gym, 24hr Security"
              />
            </label>
          </div>
        </details>

        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Units available</span>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.units_available}
            onChange={e => set('units_available', e.target.value)}
            placeholder="e.g. 12 (leave blank if N/A)"
          />
        </label>

        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Description (Markdown)</span>
          <textarea
            className={`${inputCls} font-mono resize-none`}
            rows={6}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Buyer-facing description…"
          />
        </label>

        <button
          onClick={toggleDraft}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-button text-body-sm font-semibold transition-colors ${
            form.verification_status === 'draft'
              ? 'bg-action text-white hover:bg-action-hover'
              : 'bg-beige text-navy hover:bg-divider/50 border border-divider'
          }`}
        >
          {form.verification_status === 'draft' ? (
            <>
              <Send size={14} strokeWidth={2.2} /> Publish (move to submitted)
            </>
          ) : (
            <>
              <FileText size={14} strokeWidth={2.2} /> Move to draft
            </>
          )}
        </button>

        <div className="flex items-center justify-between bg-beige rounded-card px-4 py-3 border border-divider">
          <div>
            <p className="text-body-sm text-navy font-semibold">Featured listing</p>
            <p className="text-caption text-subtle">Pinned to homepage and search top</p>
          </div>
          <button
            onClick={() => set('featured', !form.featured)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              form.featured ? 'bg-action' : 'bg-divider'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                form.featured ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

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
          onClick={onCancel}
          className="px-5 py-3 rounded-button border border-divider text-subtle hover:text-navy hover:bg-beige text-body-sm font-semibold transition-all duration-150"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const TITLE_TYPES = [
  ['', '— Select —'],
  ['c_of_o', 'Certificate of Occupancy (C of O)'],
  ['r_of_o', 'Right of Occupancy (R of O)'],
  ['governors_consent', "Governor's Consent"],
  ['deed_of_assignment', 'Deed of Assignment'],
  ['customary', 'Customary'],
  ['allocation_letter', 'Allocation Letter'],
] as const
