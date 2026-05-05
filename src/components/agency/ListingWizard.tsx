'use client'

/**
 * The 10-section listing submission wizard.
 *
 * The verification spec has 10 sections. The agency only fills 1–7; sections
 * 8 (site inspection), 9 (legal/encumbrance), and 10 (geospatial) are
 * Propabridge-internal. Showing 10 steps would be hostile; bundling 1–7 into
 * one giant form would also be hostile. Five steps, one thought per step,
 * defaults pre-filled where the answer is obvious.
 *
 * Submit hits POST /agency/listings, which writes the listing + verification
 * record + runs anomaly checks in one transaction. Findings come back in the
 * response and we show them on the success screen — the agency sees what the
 * reviewer will see, no surprises.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  MapPin,
  DollarSign,
  Wrench,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Upload,
} from 'lucide-react'
import { agency } from '@/lib/agency-api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ── form shape ──────────────────────────────────────────────────────────────

type FormState = {
  // step 1 — basics
  title: string
  intent: 'for_sale' | 'for_rent' | 'off_plan'
  property_type: 'terrace' | 'semi_detached' | 'detached' | 'flat' | 'plot' | 'mixed_use' | 'commercial'
  bedrooms: string
  bathrooms: string
  declared_plot_size_sqm: string
  built_up_area_sqm: string
  description: string
  // step 2 — location & title
  address_line: string
  city: string
  neighborhood: string
  cadastral_zone: string
  plot_number: string
  title_type: 'c_of_o' | 'r_of_o' | 'governors_consent' | 'deed_of_assignment' | 'customary' | 'allocation_letter' | ''
  title_file_no: string
  title_holder_name: string
  title_issued_date: string
  title_issuing_authority: string
  // step 3 — pricing
  asking_price_ngn: string
  payment_plan: 'outright' | 'installment' | 'mortgage' | 'off_plan_milestones'
  service_charge_ngn_per_year: string
  propabridge_commission_pct: string
  attribution_window_months: string
  // step 4 — developer + utilities + estate
  selling_entity_type: 'developer' | 'agent' | 'owner_direct' | 'cooperative' | 'subsidiary'
  selling_entity_legal_name: string
  cac_rc_number: string
  power_supply: 'grid' | 'grid_inverter' | 'solar' | 'generator_only' | 'none' | ''
  water_supply: 'mains' | 'borehole' | 'none' | ''
  sewage: 'mains' | 'septic' | 'soakaway' | ''
  road_access: 'tarred' | 'graded' | 'untarred' | 'seasonal' | ''
  is_estate_unit: boolean
  estate_name: string
  construction_status: 'bare_land' | 'excavation' | 'foundation' | 'walling' | 'roofing' | 'finishing' | 'completed' | ''
  // step 5 — photos + polygon
  imageUrls: string[]
  polygon_geojson: string
}

const INITIAL: FormState = {
  title: '',
  intent: 'for_sale',
  property_type: 'detached',
  bedrooms: '',
  bathrooms: '',
  declared_plot_size_sqm: '',
  built_up_area_sqm: '',
  description: '',
  address_line: '',
  city: 'Abuja',
  neighborhood: '',
  cadastral_zone: '',
  plot_number: '',
  title_type: 'c_of_o',
  title_file_no: '',
  title_holder_name: '',
  title_issued_date: '',
  title_issuing_authority: 'FCT Land Registry',
  asking_price_ngn: '',
  payment_plan: 'outright',
  service_charge_ngn_per_year: '',
  propabridge_commission_pct: '5',
  attribution_window_months: '12',
  selling_entity_type: 'developer',
  selling_entity_legal_name: '',
  cac_rc_number: '',
  power_supply: 'grid',
  water_supply: 'borehole',
  sewage: 'septic',
  road_access: 'tarred',
  is_estate_unit: false,
  estate_name: '',
  construction_status: 'completed',
  imageUrls: [],
  polygon_geojson: '',
}

const STEPS = [
  { key: 'basics', label: 'Basics', icon: Building2 },
  { key: 'location', label: 'Location & title', icon: MapPin },
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'specs', label: 'Specs & seller', icon: Wrench },
  { key: 'photos', label: 'Photos & map', icon: Camera },
  { key: 'review', label: 'Review', icon: CheckCircle2 },
] as const

// ── component ───────────────────────────────────────────────────────────────

export function ListingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    listing: { id: string; title: string }
    findings: Array<{ id: string; code: string; severity: string; message: string }>
  } | null>(null)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setStepError(null)
  }

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.title.trim()) return 'Listing title is required.'
      if (!form.declared_plot_size_sqm) return 'Plot size is required.'
    }
    if (step === 1) {
      if (!form.address_line.trim()) return 'Address is required.'
      if (!form.city.trim()) return 'City is required.'
      if (!form.title_type) return 'Title type is required.'
      if (!form.title_file_no.trim()) return 'Title file number is required (this is a verification block otherwise).'
      if (!form.title_holder_name.trim()) return 'Title holder name is required.'
    }
    if (step === 2) {
      if (!form.asking_price_ngn) return 'Asking price is required.'
    }
    if (step === 3) {
      if (!form.selling_entity_legal_name.trim()) return 'Seller legal name is required.'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) {
      setStepError(err)
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const num = (s: string) => (s.trim() ? Number(s) : null)
      const body = {
        // listing fields
        title: form.title,
        type: form.intent === 'for_rent' ? 'rent' : 'sale',
        description: form.description,
        // verification fields the backend picks up via pickFields()
        intent: form.intent,
        address_line: form.address_line,
        city: form.city,
        neighborhood: form.neighborhood,
        cadastral_zone: form.cadastral_zone || null,
        plot_number: form.plot_number || null,
        title_type: form.title_type || null,
        title_file_no: form.title_file_no,
        title_holder_name: form.title_holder_name,
        title_issued_date: form.title_issued_date || null,
        title_issuing_authority: form.title_issuing_authority,
        property_type: form.property_type,
        bedrooms: num(form.bedrooms),
        bathrooms: num(form.bathrooms),
        declared_plot_size_sqm: num(form.declared_plot_size_sqm),
        built_up_area_sqm: num(form.built_up_area_sqm),
        construction_status: form.construction_status || null,
        asking_price_ngn: num(form.asking_price_ngn),
        currency: 'NGN',
        payment_plan: form.payment_plan,
        service_charge_ngn_per_year: num(form.service_charge_ngn_per_year),
        propabridge_commission_pct: num(form.propabridge_commission_pct),
        attribution_window_months: num(form.attribution_window_months),
        power_supply: form.power_supply || null,
        water_supply: form.water_supply || null,
        sewage: form.sewage || null,
        road_access: form.road_access || null,
        is_estate_unit: form.is_estate_unit,
        estate_name: form.is_estate_unit ? form.estate_name : null,
        images: form.imageUrls.length > 0 ? form.imageUrls : undefined,
        polygon_geojson: form.polygon_geojson.trim() || undefined,
        selling_entity_legal_name: form.selling_entity_legal_name,
        cac_rc_number: form.cac_rc_number || null,
      }
      type SubmitResp = {
        listing: { id: string; title: string }
        findings: Array<{ id: string; code: string; severity: string; message: string }>
      }
      const res = await agency.send<SubmitResp>('/listings', 'POST', body)
      setResult(res)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── success screen ────────────────────────────────────────────────────────

  if (result) {
    const blocks = result.findings.filter((f) => f.severity === 'block')
    const flags = result.findings.filter((f) => f.severity === 'flag')
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-card border border-divider shadow-card p-8 text-center">
          <CheckCircle2 size={48} className="text-verified mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-h3 text-navy mb-2">Submitted for verification</h1>
          <p className="text-body-sm text-subtle">
            Your listing is in the verification queue. Propabridge will review the
            title chain, run the AGIS cross-check, and visit the site before it
            goes live to buyers.
          </p>
        </div>

        {(blocks.length > 0 || flags.length > 0) && (
          <div className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-divider">
              <h2 className="text-h4 text-navy">What our checks found</h2>
              <p className="text-caption text-subtle mt-1">
                {blocks.length > 0
                  ? 'These items must be resolved before your listing can be verified.'
                  : 'Reviewer will adjudicate these before sign-off.'}
              </p>
            </div>
            <div className="divide-y divide-divider">
              {[...blocks, ...flags].map((f) => (
                <div key={f.id} className="px-6 py-4 flex items-start gap-3">
                  {f.severity === 'block' ? (
                    <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                  ) : (
                    <Flag size={18} className="text-warning flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-body-sm text-navy">{f.message}</p>
                    <p className="text-caption text-subtle mt-1">{f.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/agency/listings')}>
            Back to listings
          </Button>
          <Button onClick={() => { setResult(null); setStep(0); setForm({...INITIAL}) }}>
            Submit another
          </Button>
        </div>
      </div>
    )
  }

  // ── form ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isCurrent = i === step
          const isPast = i < step
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCurrent
                      ? 'bg-action text-white'
                      : isPast
                        ? 'bg-verified text-white'
                        : 'bg-beige text-subtle'
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                </div>
                <p className={`text-caption mt-2 font-medium ${isCurrent ? 'text-navy' : 'text-subtle'}`}>
                  {s.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 -mt-6 ${isPast ? 'bg-verified' : 'bg-beige'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-card border border-divider shadow-card p-6 sm:p-8">
        {/* Step content */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">The basics</h2>
              <p className="text-body-sm text-subtle mt-1">What is the property?</p>
            </div>
            <Input label="Listing title" placeholder="4-bedroom terrace in Wuse 2" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Listing intent" value={form.intent} onChange={(v) => set('intent', v as FormState['intent'])} options={[['for_sale','For sale'],['for_rent','For rent'],['off_plan','Off-plan']]} />
              <SelectField label="Property type" value={form.property_type} onChange={(v) => set('property_type', v as FormState['property_type'])} options={[['detached','Detached'],['semi_detached','Semi-detached'],['terrace','Terrace'],['flat','Flat'],['plot','Plot / land'],['mixed_use','Mixed-use'],['commercial','Commercial']]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
              <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Plot size (sqm)" type="number" value={form.declared_plot_size_sqm} onChange={(e) => set('declared_plot_size_sqm', e.target.value)} />
              <Input label="Built-up area (sqm)" type="number" value={form.built_up_area_sqm} onChange={(e) => set('built_up_area_sqm', e.target.value)} />
            </div>
            <TextareaField label="Description" value={form.description} onChange={(v) => set('description', v)} placeholder="What's the property like? Buyers see this verbatim." />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">Location & title</h2>
              <p className="text-body-sm text-subtle mt-1">Where is it, and who legally owns it?</p>
            </div>
            <Input label="Address" placeholder="Plot 585 Cadastral Zone B10, Dakibiyu" value={form.address_line} onChange={(e) => set('address_line', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <Input label="Neighborhood" placeholder="Wuse 2" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Cadastral zone" placeholder="B10" value={form.cadastral_zone} onChange={(e) => set('cadastral_zone', e.target.value)} />
              <Input label="Plot number" placeholder="Plot 585" value={form.plot_number} onChange={(e) => set('plot_number', e.target.value)} />
            </div>
            <SelectField label="Title type" value={form.title_type} onChange={(v) => set('title_type', v as FormState['title_type'])} options={[['c_of_o','Certificate of Occupancy (C of O)'],['r_of_o','Right of Occupancy (R of O)'],['governors_consent','Governor\'s Consent'],['deed_of_assignment','Deed of Assignment'],['customary','Customary'],['allocation_letter','Allocation Letter']]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Title file number" placeholder="AD60027" value={form.title_file_no} onChange={(e) => set('title_file_no', e.target.value)} helperText="Required — listings without a file number cannot be verified." />
              <Input label="Title issued date" type="date" value={form.title_issued_date} onChange={(e) => set('title_issued_date', e.target.value)} />
            </div>
            <Input label="Title holder name" placeholder="As printed on the C of O" value={form.title_holder_name} onChange={(e) => set('title_holder_name', e.target.value)} helperText="If different from the seller name, you'll need a notarised PoA or deed of assignment." />
            <Input label="Issuing authority" value={form.title_issuing_authority} onChange={(e) => set('title_issuing_authority', e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">Pricing & terms</h2>
              <p className="text-body-sm text-subtle mt-1">What does it cost, and what's our share?</p>
            </div>
            <Input label="Asking price (₦)" type="number" placeholder="180000000" value={form.asking_price_ngn} onChange={(e) => set('asking_price_ngn', e.target.value)} />
            <SelectField label="Payment plan" value={form.payment_plan} onChange={(v) => set('payment_plan', v as FormState['payment_plan'])} options={[['outright','Outright'],['installment','Installment'],['mortgage','Mortgage'],['off_plan_milestones','Off-plan milestones']]} />
            <Input label="Service charge (₦/year)" type="number" placeholder="0" value={form.service_charge_ngn_per_year} onChange={(e) => set('service_charge_ngn_per_year', e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Propabridge commission (%)" type="number" value={form.propabridge_commission_pct} onChange={(e) => set('propabridge_commission_pct', e.target.value)} helperText="Default 5% — overrides require an active MoU." />
              <Input label="Attribution window (months)" type="number" value={form.attribution_window_months} onChange={(e) => set('attribution_window_months', e.target.value)} helperText="Default 12 months." />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">Specs & seller</h2>
              <p className="text-body-sm text-subtle mt-1">Who's selling, and what's on the ground?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Selling entity type" value={form.selling_entity_type} onChange={(v) => set('selling_entity_type', v as FormState['selling_entity_type'])} options={[['developer','Developer'],['agent','Agent'],['owner_direct','Owner direct'],['cooperative','Cooperative'],['subsidiary','Subsidiary']]} />
              <Input label="CAC RC number" placeholder="RC. 8527315" value={form.cac_rc_number} onChange={(e) => set('cac_rc_number', e.target.value)} />
            </div>
            <Input label="Selling entity legal name" placeholder="As registered with CAC" value={form.selling_entity_legal_name} onChange={(e) => set('selling_entity_legal_name', e.target.value)} />

            <SelectField label="Construction status" value={form.construction_status} onChange={(v) => set('construction_status', v as FormState['construction_status'])} options={[['bare_land','Bare land'],['excavation','Excavation'],['foundation','Foundation'],['walling','Walling'],['roofing','Roofing'],['finishing','Finishing'],['completed','Completed']]} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField label="Power supply" value={form.power_supply} onChange={(v) => set('power_supply', v as FormState['power_supply'])} options={[['grid','Grid'],['grid_inverter','Grid + inverter'],['solar','Solar'],['generator_only','Generator only'],['none','None']]} />
              <SelectField label="Water" value={form.water_supply} onChange={(v) => set('water_supply', v as FormState['water_supply'])} options={[['mains','Mains'],['borehole','Borehole'],['none','None']]} />
              <SelectField label="Sewage" value={form.sewage} onChange={(v) => set('sewage', v as FormState['sewage'])} options={[['mains','Mains'],['septic','Septic'],['soakaway','Soakaway']]} />
              <SelectField label="Road access" value={form.road_access} onChange={(v) => set('road_access', v as FormState['road_access'])} options={[['tarred','Tarred'],['graded','Graded'],['untarred','Untarred'],['seasonal','Seasonal']]} />
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_estate_unit} onChange={(e) => set('is_estate_unit', e.target.checked)} className="w-4 h-4" />
              <span className="text-body-sm text-navy">This is a unit inside an estate</span>
            </label>
            {form.is_estate_unit && (
              <Input label="Estate name" value={form.estate_name} onChange={(e) => set('estate_name', e.target.value)} />
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">Photos & map</h2>
              <p className="text-body-sm text-subtle mt-1">Add photos and the property boundary. Photos sell; the polygon helps our geospatial cross-check.</p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-nav font-medium text-navy mb-2">Listing photos</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="relative group rounded-input overflow-hidden border border-divider aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) }))}
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
                        setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }))
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
              <p className="text-caption text-subtle mt-2">JPEG, PNG, or WebP. Max 8 MB each. First photo becomes the cover.</p>
            </div>

            {/* Polygon GeoJSON */}
            <div>
              <label className="block text-nav font-medium text-navy mb-2">Property boundary (GeoJSON polygon)</label>
              <textarea
                value={form.polygon_geojson}
                onChange={(e) => set('polygon_geojson', e.target.value)}
                placeholder='{"type":"Polygon","coordinates":[[[3.42,7.48],[3.43,7.48],[3.43,7.49],[3.42,7.49],[3.42,7.48]]]}'
                rows={4}
                className="w-full px-3 py-2.5 rounded-input border border-divider bg-white text-body-sm font-mono text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
              />
              <p className="text-caption text-subtle mt-1">Optional. Paste a GeoJSON polygon for the geospatial cross-check. A map drawing tool is coming soon.</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-h4 text-navy">Review</h2>
              <p className="text-body-sm text-subtle mt-1">
                Check the details below. After submit, our verification team
                will review the title, run the cross-checks, and visit the
                site before publishing.
              </p>
            </div>

            <ReviewBlock title="Basics" rows={[
              ['Title', form.title],
              ['Intent', form.intent.replace('_', ' ')],
              ['Type', form.property_type.replace('_', ' ')],
              ['Bedrooms / Bathrooms', `${form.bedrooms || '—'} / ${form.bathrooms || '—'}`],
              ['Plot / Built-up', `${form.declared_plot_size_sqm || '—'} sqm / ${form.built_up_area_sqm || '—'} sqm`],
            ]} />
            <ReviewBlock title="Location & title" rows={[
              ['Address', form.address_line],
              ['City / Neighborhood', `${form.city} / ${form.neighborhood || '—'}`],
              ['Cadastral / Plot', `${form.cadastral_zone || '—'} / ${form.plot_number || '—'}`],
              ['Title', `${form.title_type.replace('_', ' ')} · ${form.title_file_no}`],
              ['Title holder', form.title_holder_name],
            ]} />
            <ReviewBlock title="Pricing" rows={[
              ['Asking price', form.asking_price_ngn ? `₦${Number(form.asking_price_ngn).toLocaleString()}` : '—'],
              ['Payment plan', form.payment_plan.replace('_', ' ')],
              ['Commission', `${form.propabridge_commission_pct}% · ${form.attribution_window_months}-month attribution`],
            ]} />
            <ReviewBlock title="Seller & specs" rows={[
              ['Seller', `${form.selling_entity_legal_name} · ${form.selling_entity_type}`],
              ['CAC #', form.cac_rc_number || '—'],
              ['Construction', form.construction_status.replace('_', ' ')],
              ['Utilities', `${form.power_supply} / ${form.water_supply} / ${form.sewage}`],
            ]} />
            <ReviewBlock title="Photos & map" rows={[
              ['Photos', `${form.imageUrls.length} uploaded`],
              ['Polygon', form.polygon_geojson ? 'Provided' : 'Not provided'],
            ]} />
          </div>
        )}

        {/* Footer */}
        {(stepError || error) && (
          <div className="mt-6 flex items-start gap-2 p-3 rounded-input bg-danger-light/50 border border-danger/20">
            <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-danger">{stepError || error}</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0 || submitting}>
            <ArrowLeft size={14} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>
              Next <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={submit} isLoading={submitting}>
              Submit for verification <CheckCircle2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── small helpers ───────────────────────────────────────────────────────────

function SelectField({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<[string, string]>
}) {
  return (
    <div className="w-full">
      <label className="block text-nav font-medium text-navy mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy focus:outline-none focus:ring-2 focus:ring-action"
      >
        {options.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
      </select>
    </div>
  )
}

function TextareaField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="w-full">
      <label className="block text-nav font-medium text-navy mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
      />
    </div>
  )
}

function ReviewBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="rounded-input border border-divider p-4">
      <h3 className="text-body-sm font-semibold text-navy mb-3">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-body-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-subtle">{k}</dt>
            <dd className="text-navy text-right truncate">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
