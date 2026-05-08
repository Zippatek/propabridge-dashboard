'use client'

import { useCallback, useRef, useState } from 'react'
import {
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Check,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  ListOrdered,
  Heading2,
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { LISTING_TYPES_DB, normalizeListingType } from '@/lib/listing-type'
import type { AiListingAnswers, AiListingResponse } from '@/app/api/admin/ai-listing/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddListingDrawerProps {
  onClose: () => void
  onCreated: () => void
}

type Step = 'questions' | 'generating' | 'review'

const LISTING_TYPES = LISTING_TYPES_DB
const PROPERTY_TYPES = ['apartment', 'house', 'duplex', 'bungalow', 'land', 'commercial', 'villa', 'penthouse']

const TITLE_TYPES = [
  ['', '— Select —'],
  ['c_of_o', 'Certificate of Occupancy (C of O)'],
  ['r_of_o', 'Right of Occupancy (R of O)'],
  ['governors_consent', "Governor's Consent"],
  ['deed_of_assignment', 'Deed of Assignment'],
  ['customary', 'Customary'],
  ['allocation_letter', 'Allocation Letter'],
] as const

const PAYMENT_PLANS = [
  ['outright', 'Outright'],
  ['installment', 'Installment'],
  ['mortgage', 'Mortgage'],
  ['off_plan_milestones', 'Off-plan milestones'],
] as const

const SELLING_ENTITY_TYPES = [
  ['developer', 'Developer'],
  ['agent', 'Agent'],
  ['owner_direct', 'Owner direct'],
  ['cooperative', 'Cooperative'],
  ['subsidiary', 'Subsidiary'],
] as const

const POWER_OPTS = ['', 'grid', 'grid_inverter', 'solar', 'generator_only', 'none']
const WATER_OPTS = ['', 'mains', 'borehole', 'none']
const SEWAGE_OPTS = ['', 'mains', 'septic', 'soakaway']
const ROAD_OPTS = ['', 'tarred', 'graded', 'untarred', 'seasonal']
const CONSTRUCTION_OPTS = ['', 'finished', 'semi_finished', 'under_construction', 'off_plan', 'plots']
const CONDITION_OPTS = ['', 'new', 'renovated', 'existing']
const INTENT_OPTS = [
  ['for_sale', 'For sale'],
  ['for_rent', 'For rent'],
  ['off_plan', 'Off-plan'],
] as const

// ─── Markdown Toolbar ─────────────────────────────────────────────────────────

function applyMarkdown(
  textarea: HTMLTextAreaElement,
  syntax: 'bold' | 'italic' | 'code' | 'blockquote' | 'bullet' | 'numbered' | 'h2',
  value: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = value.slice(start, end)
  const before = value.slice(0, start)
  const after = value.slice(end)

  let insert = ''
  let cursorOffset = 0

  switch (syntax) {
    case 'bold':
      insert = `**${selected || 'bold text'}**`
      cursorOffset = selected ? insert.length : 2
      break
    case 'italic':
      insert = `*${selected || 'italic text'}*`
      cursorOffset = selected ? insert.length : 1
      break
    case 'code':
      insert = `\`${selected || 'code'}\``
      cursorOffset = selected ? insert.length : 1
      break
    case 'blockquote': {
      const lines = (selected || 'quote').split('\n').map(l => `> ${l}`).join('\n')
      insert = lines
      cursorOffset = insert.length
      break
    }
    case 'bullet':
      insert = `\n- ${selected || 'item'}`
      cursorOffset = insert.length
      break
    case 'numbered':
      insert = `\n1. ${selected || 'item'}`
      cursorOffset = insert.length
      break
    case 'h2':
      insert = `\n## ${selected || 'Heading'}`
      cursorOffset = insert.length
      break
  }

  const newValue = before + insert + after
  onChange(newValue)

  requestAnimationFrame(() => {
    textarea.focus()
    const pos = start + cursorOffset
    textarea.setSelectionRange(pos, pos)
  })
}

interface MarkdownEditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

function MarkdownEditor({ value, onChange, placeholder, rows = 12 }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const apply = (syntax: Parameters<typeof applyMarkdown>[1]) => {
    if (!ref.current) return
    applyMarkdown(ref.current, syntax, value, onChange)
  }

  const toolbarBtnCls =
    'flex items-center justify-center w-7 h-7 rounded text-subtle hover:text-navy hover:bg-beige ' +
    'transition-colors duration-100 text-caption font-bold'

  return (
    <div className="border border-divider rounded-input overflow-hidden focus-within:ring-2 focus-within:ring-action focus-within:border-transparent transition-all duration-150">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-beige/60 border-b border-divider flex-wrap">
        <button type="button" title="Bold" onClick={() => apply('bold')} className={toolbarBtnCls}>
          <Bold size={13} strokeWidth={2.5} />
        </button>
        <button type="button" title="Italic" onClick={() => apply('italic')} className={toolbarBtnCls}>
          <Italic size={13} strokeWidth={2.5} />
        </button>
        <button type="button" title="Inline code" onClick={() => apply('code')} className={toolbarBtnCls}>
          <Code size={13} strokeWidth={2.5} />
        </button>
        <div className="w-px h-4 bg-divider mx-1" />
        <button type="button" title="Blockquote" onClick={() => apply('blockquote')} className={toolbarBtnCls}>
          <Quote size={13} strokeWidth={2.5} />
        </button>
        <button type="button" title="Bullet list" onClick={() => apply('bullet')} className={toolbarBtnCls}>
          <List size={13} strokeWidth={2.5} />
        </button>
        <button type="button" title="Numbered list" onClick={() => apply('numbered')} className={toolbarBtnCls}>
          <ListOrdered size={13} strokeWidth={2.5} />
        </button>
        <div className="w-px h-4 bg-divider mx-1" />
        <button type="button" title="Heading 2" onClick={() => apply('h2')} className={toolbarBtnCls}>
          <Heading2 size={13} strokeWidth={2.5} />
        </button>
        <span className="ml-auto text-[10px] text-placeholder font-mono">Markdown</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-3 bg-white text-navy text-body-sm font-mono resize-none focus:outline-none placeholder-placeholder leading-relaxed"
      />
    </div>
  )
}

// ─── Questions Step ───────────────────────────────────────────────────────────

const EMPTY_ANSWERS: AiListingAnswers = {
  property_type: 'apartment',
  listing_type: 'sale',
  intent: 'for_sale',
  location: '',
  address_line: '',
  city: '',
  neighborhood: '',
  cadastral_zone: '',
  plot_number: '',
  latitude: '',
  longitude: '',
  polygon_geojson: '',
  bedrooms: '',
  bathrooms: '',
  size_sqm: '',
  declared_plot_size_sqm: '',
  price: '',
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
  construction_status: 'finished',
  condition: '',
  is_estate_unit: false,
  estate_name: '',
  title_type: 'c_of_o',
  title_file_no: '',
  title_holder_name: '',
  title_issued_date: '',
  title_issuing_authority: '',
  amenities: [],
  key_features: '',
  additional_points: '',
}

function QuestionsStep({
  answers,
  onChange,
  onGenerate,
  generating,
}: {
  answers: AiListingAnswers
  onChange: (a: AiListingAnswers) => void
  onGenerate: () => void
  generating: boolean
}) {
  const set = <K extends keyof AiListingAnswers>(k: K, v: AiListingAnswers[K]) =>
    onChange({ ...answers, [k]: v })

  const inputCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'

  const selectCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 appearance-none'

  const isValid = (answers.location.trim() || (answers.city || '').trim()) && answers.price.trim() && answers.key_features.trim()

  // Amenities are surfaced as a comma-separated free-text input — easy to type,
  // easy for the AI to parse, splits cleanly into the structured array.
  const amenitiesText = (answers.amenities || []).join(', ')
  const setAmenities = (v: string) =>
    set('amenities', v.split(',').map(s => s.trim()).filter(Boolean))

  const sectionHeader = (n: number, title: string) => (
    <div className="flex items-center gap-2 pt-1">
      <div className="w-6 h-6 rounded-full bg-action-light text-action text-[11px] font-bold flex items-center justify-center">{n}</div>
      <h4 className="text-body-sm font-semibold text-navy">{title}</h4>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Intro */}
        <div className="bg-action-light border border-action/20 rounded-card px-4 py-3 flex gap-3">
          <Sparkles size={16} className="text-action flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-body-sm text-navy">
            Answer the questions below and our AI will craft a polished listing and pre-fill every structured field.
          </p>
        </div>

        {sectionHeader(1, 'The basics')}

        <div className="grid grid-cols-2 gap-3">
          <SelectFld label="Property type *" value={answers.property_type} onChange={v => set('property_type', v)} options={PROPERTY_TYPES.map(t => [t, t.charAt(0).toUpperCase() + t.slice(1)])} cls={selectCls} />
          <SelectFld
            label="Listing type *"
            value={answers.listing_type}
            onChange={v => set('listing_type', v)}
            options={LISTING_TYPES.map(t => [t, t === 'sale' ? 'Sale' : 'Rent'])}
            cls={selectCls}
          />
        </div>
        <SelectFld label="Intent" value={answers.intent || 'for_sale'} onChange={v => set('intent', v)} options={INTENT_OPTS as readonly (readonly [string, string])[]} cls={selectCls} />
        <div className="grid grid-cols-3 gap-3">
          <Fld label="Bedrooms" type="number" value={answers.bedrooms} onChange={v => set('bedrooms', v)} cls={inputCls} placeholder="4" />
          <Fld label="Bathrooms" type="number" value={answers.bathrooms} onChange={v => set('bathrooms', v)} cls={inputCls} placeholder="5" />
          <Fld label="Built-up sqm" type="number" value={answers.size_sqm || ''} onChange={v => set('size_sqm', v)} cls={inputCls} placeholder="350" />
        </div>
        <Fld label="Plot size (sqm)" type="number" value={answers.declared_plot_size_sqm || ''} onChange={v => set('declared_plot_size_sqm', v)} cls={inputCls} placeholder="600" />

        {sectionHeader(2, 'Location')}
        <Fld label="Location summary *" value={answers.location} onChange={v => set('location', v)} cls={inputCls} placeholder="e.g. Lekki Phase 1, Lagos" />
        <Fld label="Address line" value={answers.address_line || ''} onChange={v => set('address_line', v)} cls={inputCls} placeholder="Plot 585 Cadastral Zone B10, Dakibiyu" />
        <div className="grid grid-cols-2 gap-3">
          <Fld label="City" value={answers.city || ''} onChange={v => set('city', v)} cls={inputCls} placeholder="Abuja" />
          <Fld label="Neighborhood" value={answers.neighborhood || ''} onChange={v => set('neighborhood', v)} cls={inputCls} placeholder="Wuse 2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Cadastral zone" value={answers.cadastral_zone || ''} onChange={v => set('cadastral_zone', v)} cls={inputCls} placeholder="B10" />
          <Fld label="Plot number" value={answers.plot_number || ''} onChange={v => set('plot_number', v)} cls={inputCls} placeholder="Plot 585" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Latitude" value={answers.latitude || ''} onChange={v => set('latitude', v)} cls={inputCls} placeholder="9.0765" />
          <Fld label="Longitude" value={answers.longitude || ''} onChange={v => set('longitude', v)} cls={inputCls} placeholder="7.3986" />
        </div>
        <details className="group">
          <summary className="text-caption text-subtle cursor-pointer hover:text-navy">Polygon GeoJSON (optional)</summary>
          <textarea
            value={answers.polygon_geojson || ''}
            onChange={e => set('polygon_geojson', e.target.value)}
            placeholder='{"type":"Polygon","coordinates":[[[3.42,7.48],...]]}'
            rows={3}
            className={`${inputCls} font-mono mt-2 resize-none`}
          />
        </details>

        {sectionHeader(3, 'Title & legal')}
        <SelectFld label="Title type" value={answers.title_type || ''} onChange={v => set('title_type', v)} options={TITLE_TYPES as readonly (readonly [string, string])[]} cls={selectCls} />
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Title file no." value={answers.title_file_no || ''} onChange={v => set('title_file_no', v)} cls={inputCls} placeholder="AD60027" />
          <Fld label="Title issued date" type="date" value={answers.title_issued_date || ''} onChange={v => set('title_issued_date', v)} cls={inputCls} />
        </div>
        <Fld label="Title holder name" value={answers.title_holder_name || ''} onChange={v => set('title_holder_name', v)} cls={inputCls} placeholder="As printed on the C of O" />
        <Fld label="Issuing authority" value={answers.title_issuing_authority || ''} onChange={v => set('title_issuing_authority', v)} cls={inputCls} placeholder="FCT Land Registry" />

        {sectionHeader(4, 'Pricing & terms')}
        <Fld label="Asking price (₦) *" type="number" value={answers.price} onChange={v => set('price', v)} cls={inputCls} placeholder="450000000" />
        <SelectFld label="Payment plan" value={answers.payment_plan || 'outright'} onChange={v => set('payment_plan', v)} options={PAYMENT_PLANS as readonly (readonly [string, string])[]} cls={selectCls} />
        <Fld label="Service charge (₦/year)" type="number" value={answers.service_charge_ngn_per_year || ''} onChange={v => set('service_charge_ngn_per_year', v)} cls={inputCls} placeholder="0" />
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Commission (%)" type="number" value={answers.propabridge_commission_pct || ''} onChange={v => set('propabridge_commission_pct', v)} cls={inputCls} placeholder="5" />
          <Fld label="Attribution (months)" type="number" value={answers.attribution_window_months || ''} onChange={v => set('attribution_window_months', v)} cls={inputCls} placeholder="12" />
        </div>

        {sectionHeader(5, 'Seller')}
        <SelectFld label="Selling entity type" value={answers.selling_entity_type || 'developer'} onChange={v => set('selling_entity_type', v)} options={SELLING_ENTITY_TYPES as readonly (readonly [string, string])[]} cls={selectCls} />
        <Fld label="Selling entity legal name" value={answers.selling_entity_legal_name || ''} onChange={v => set('selling_entity_legal_name', v)} cls={inputCls} placeholder="As registered with CAC" />
        <Fld label="CAC RC number" value={answers.cac_rc_number || ''} onChange={v => set('cac_rc_number', v)} cls={inputCls} placeholder="RC. 8527315" />

        {sectionHeader(6, 'Utilities & condition')}
        <div className="grid grid-cols-2 gap-3">
          <SelectFld label="Power supply" value={answers.power_supply || ''} onChange={v => set('power_supply', v)} options={POWER_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
          <SelectFld label="Water" value={answers.water_supply || ''} onChange={v => set('water_supply', v)} options={WATER_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
          <SelectFld label="Sewage" value={answers.sewage || ''} onChange={v => set('sewage', v)} options={SEWAGE_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
          <SelectFld label="Road access" value={answers.road_access || ''} onChange={v => set('road_access', v)} options={ROAD_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectFld label="Construction status" value={answers.construction_status || ''} onChange={v => set('construction_status', v)} options={CONSTRUCTION_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
          <SelectFld label="Condition" value={answers.condition || ''} onChange={v => set('condition', v)} options={CONDITION_OPTS.map(o => [o, o || '— —'])} cls={selectCls} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4" checked={!!answers.is_estate_unit} onChange={e => set('is_estate_unit', e.target.checked)} />
          <span className="text-body-sm text-navy">This is a unit inside an estate</span>
        </label>
        {answers.is_estate_unit && (
          <Fld label="Estate name" value={answers.estate_name || ''} onChange={v => set('estate_name', v)} cls={inputCls} />
        )}

        {sectionHeader(7, 'Amenities & narrative')}
        <Fld label="Amenities (comma-separated)" value={amenitiesText} onChange={setAmenities} cls={inputCls} placeholder="Pool, Gym, 24hr Security, Borehole, BQ, Solar, Smart Home" />
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            Key features <span className="text-danger">*</span>
          </span>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            value={answers.key_features}
            onChange={e => set('key_features', e.target.value)}
            placeholder="e.g. 4 ensuite bedrooms, private study, rooftop terrace, smart home..."
          />
        </label>
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            Additional selling points <span className="text-placeholder">(optional)</span>
          </span>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            value={answers.additional_points || ''}
            onChange={e => set('additional_points', e.target.value)}
            placeholder="e.g. Recently renovated, close to Eko Atlantic, motivated seller..."
          />
        </label>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-divider">
        <button
          onClick={onGenerate}
          disabled={!isValid || generating}
          className="w-full flex items-center justify-center gap-2 bg-action hover:bg-action-hover disabled:opacity-50 text-white font-semibold py-3 rounded-button transition-all duration-150"
        >
          {generating ? (
            <>
              <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={2.5} />
              Generate listing content
              <ChevronRight size={15} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Small field helpers ─────────────────────────────────────────────────────

function Fld({
  label, value, onChange, cls, type = 'text', placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  cls: string
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-caption text-subtle font-semibold mb-1.5 block">{label}</span>
      <input className={cls} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}

function SelectFld({
  label, value, onChange, options, cls,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: ReadonlyArray<readonly [string, string]> | Array<[string, string]>
  cls: string
}) {
  return (
    <label className="block">
      <span className="text-caption text-subtle font-semibold mb-1.5 block">{label}</span>
      <div className="relative">
        <select className={cls} value={value} onChange={e => onChange(e.target.value)}>
          {options.map(([v, lab]) => <option key={v} value={v}>{lab}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
      </div>
    </label>
  )
}

// ─── Images uploader (multi-file) ────────────────────────────────────────────
// Uploads happen one at a time against /api/admin/upload-image, which proxies
// to the backend's POST /listings/uploads/image with the admin token attached
// server-side. URLs are accumulated in state and submitted with the listing.

function ImagesUploader({
  images,
  onChange,
}: {
  images: string[]
  onChange: (imgs: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setErr(null)
    const next = [...images]
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          credentials: 'same-origin',
          body: fd,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Upload failed (${res.status})`)
        }
        const { url } = await res.json()
        next.push(url)
        onChange([...next])
      }
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="text-caption text-subtle font-semibold mb-1.5 block">
        Photos <span className="text-placeholder">(first becomes the cover)</span>
      </span>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <div key={url + i} className="relative group rounded-input overflow-hidden border border-divider aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 bg-navy/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-action text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Cover</span>
            )}
          </div>
        ))}
        <label className={`flex flex-col items-center justify-center rounded-input border-2 border-dashed aspect-[4/3] cursor-pointer transition-colors ${uploading ? 'border-action bg-action-light/20 opacity-60' : 'border-divider hover:border-action hover:bg-beige/30'}`}>
          {uploading ? (
            <Loader2 size={20} className="text-action animate-spin" strokeWidth={1.5} />
          ) : (
            <Upload size={20} className="text-subtle mb-1" strokeWidth={1.5} />
          )}
          <span className="text-caption text-subtle mt-1">{uploading ? 'Uploading…' : 'Add photos'}</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
          />
        </label>
      </div>
      {err && (
        <p className="text-caption text-danger mt-2 flex items-center gap-1">
          <AlertCircle size={12} /> {err}
        </p>
      )}
    </div>
  )
}

// ─── Generating Step ──────────────────────────────────────────────────────────

function GeneratingStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-action-light flex items-center justify-center">
          <Sparkles size={28} className="text-action" strokeWidth={1.8} />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-action/40 animate-ping" />
      </div>
      <div>
        <p className="text-h4 text-navy font-semibold">Writing your listing…</p>
        <p className="text-body-sm text-subtle mt-1">Claude is crafting an expert property description</p>
      </div>
    </div>
  )
}

// ─── Review Step ──────────────────────────────────────────────────────────────

interface ReviewFields {
  title: string
  slug: string
  city: string
  neighborhood: string
  address: string
  listing_type: string
  property_type: string
  bedrooms: string
  bathrooms: string
  size_sqm: string
  price: string
  description: string
  amenities: string[]
  images: string[]
}

function ReviewStep({
  fields,
  onChange,
  onSubmit,
  saving,
  onBack,
  error,
}: {
  fields: ReviewFields
  onChange: (f: ReviewFields) => void
  onSubmit: () => void
  saving: boolean
  onBack: () => void
  error: string | null
}) {
  const set = (k: keyof ReviewFields, v: string) => onChange({ ...fields, [k]: v })

  const inputCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'

  const selectCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 appearance-none'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* AI success banner */}
        <div className="bg-verified-light border border-verified/20 rounded-card px-4 py-3 flex gap-3">
          <Sparkles size={16} className="text-verified flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-body-sm text-navy">AI content generated. Review and edit everything before saving.</p>
        </div>

        {/* Description editor */}
        <div>
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Description (Markdown)</span>
          <MarkdownEditor
            value={fields.description}
            onChange={v => set('description', v)}
            placeholder="Property description…"
            rows={14}
          />
        </div>

        {/* Image upload */}
        <ImagesUploader
          images={fields.images}
          onChange={imgs => onChange({ ...fields, images: imgs })}
        />

        {/* Title */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Title</span>
          <input className={inputCls} value={fields.title} onChange={e => set('title', e.target.value)} placeholder="Listing title" />
        </label>

        {/* City + Slug */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">City</span>
            <input className={inputCls} value={fields.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Lagos" />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Slug</span>
            <input className={inputCls} value={fields.slug} onChange={e => set('slug', e.target.value)} placeholder="url-slug" />
          </label>
        </div>

        {/* Neighborhood + Address */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Neighborhood</span>
            <input className={inputCls} value={fields.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="e.g. Wuse 2" />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Address</span>
            <input className={inputCls} value={fields.address} onChange={e => set('address', e.target.value)} placeholder="Street / plot" />
          </label>
        </div>

        {/* Amenities */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Amenities (comma-separated)</span>
          <input
            className={inputCls}
            value={fields.amenities.join(', ')}
            onChange={e => onChange({ ...fields, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="Pool, Gym, 24hr Security"
          />
        </label>

        {/* Price */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">Price (₦)</span>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={fields.price}
            onChange={e => set('price', e.target.value)}
            placeholder="e.g. 450000000"
          />
        </label>

        {/* Listing Type + Property Type */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Listing type</span>
            <div className="relative">
              <select className={selectCls} value={fields.listing_type} onChange={e => set('listing_type', e.target.value)}>
                {LISTING_TYPES.map(t => (
                  <option key={t} value={t}>{t === 'sale' ? 'Sale' : 'Rent'}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Property type</span>
            <div className="relative">
              <select className={selectCls} value={fields.property_type} onChange={e => set('property_type', e.target.value)}>
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
            <input className={inputCls} type="number" min={0} value={fields.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="—" />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Baths</span>
            <input className={inputCls} type="number" min={0} value={fields.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="—" />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">sqm</span>
            <input className={inputCls} type="number" min={0} value={fields.size_sqm} onChange={e => set('size_sqm', e.target.value)} placeholder="—" />
          </label>
        </div>

        {error && (
          <div className="bg-danger-light border border-danger/20 text-danger text-body-sm rounded-card px-4 py-3 flex gap-2">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-divider flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-white font-semibold py-3 rounded-button transition-all duration-150 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check size={15} strokeWidth={2.5} />
              Save listing
            </>
          )}
        </button>
        <button
          onClick={onBack}
          disabled={saving}
          className="px-5 py-3 rounded-button border border-divider text-subtle hover:text-navy hover:bg-beige text-body-sm font-semibold transition-all duration-150 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export default function AddListingDrawer({ onClose, onCreated }: AddListingDrawerProps) {
  const [step, setStep] = useState<Step>('questions')
  const [answers, setAnswers] = useState<AiListingAnswers>(EMPTY_ANSWERS)
  const [aiError, setAiError] = useState<string | null>(null)
  const [reviewFields, setReviewFields] = useState<ReviewFields>({
    title: '',
    slug: '',
    city: '',
    neighborhood: '',
    address: '',
    listing_type: 'sale',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    size_sqm: '',
    price: '',
    description: '',
    amenities: [],
    images: [],
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    setAiError(null)
    setStep('generating')
    try {
      const res = await fetch('/api/admin/ai-listing', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `AI request failed (${res.status})`)
      }
      const data: AiListingResponse = await res.json()
      const f = data.fields
      setReviewFields({
        title:         f.title || '',
        slug:          f.slug  || '',
        city:          f.city  || answers.city || '',
        neighborhood:  f.neighborhood || answers.neighborhood || '',
        address:       f.address || answers.address_line || '',
        listing_type:  normalizeListingType(f.listing_type || answers.listing_type),
        property_type: f.property_type || answers.property_type,
        bedrooms:      f.bedrooms  != null ? String(f.bedrooms)  : answers.bedrooms,
        bathrooms:     f.bathrooms != null ? String(f.bathrooms) : answers.bathrooms,
        size_sqm:      f.size_sqm  != null ? String(f.size_sqm)  : (answers.size_sqm || ''),
        price:         f.price     != null ? String(f.price)     : answers.price,
        description:   data.description,
        amenities:     Array.isArray(f.amenities) && f.amenities.length ? f.amenities : (answers.amenities || []),
        images:        [],
      })
      setStep('review')
    } catch (e) {
      setAiError((e as Error).message)
      setStep('questions')
    }
  }, [answers])

  const handleSubmit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const num = (s: string) => (s.trim() === '' ? undefined : Number(s))
      const payload: Record<string, unknown> = {
        // headline
        title:         reviewFields.title         || undefined,
        slug:          reviewFields.slug          || undefined,
        description:   reviewFields.description   || undefined,
        listing_type:  normalizeListingType(reviewFields.listing_type),
        property_type: reviewFields.property_type,
        // location
        city:          reviewFields.city          || undefined,
        neighborhood:  reviewFields.neighborhood  || undefined,
        address:       reviewFields.address       || undefined,
        address_line:  reviewFields.address       || undefined,
        cadastral_zone: answers.cadastral_zone    || undefined,
        plot_number:   answers.plot_number        || undefined,
        latitude:      num(answers.latitude || ''),
        longitude:     num(answers.longitude || ''),
        polygon_geojson: answers.polygon_geojson?.trim() || undefined,
        // numbers
        price:         num(reviewFields.price),
        asking_price_ngn: num(reviewFields.price),
        bedrooms:      num(reviewFields.bedrooms),
        bathrooms:     num(reviewFields.bathrooms),
        size_sqm:      num(reviewFields.size_sqm),
        built_up_area_sqm: num(answers.size_sqm || ''),
        declared_plot_size_sqm: num(answers.declared_plot_size_sqm || ''),
        // commercial
        intent:        answers.intent             || undefined,
        currency:      'NGN',
        payment_plan:  answers.payment_plan       || undefined,
        service_charge_ngn_per_year: num(answers.service_charge_ngn_per_year || ''),
        propabridge_commission_pct:  num(answers.propabridge_commission_pct  || ''),
        attribution_window_months:   num(answers.attribution_window_months   || ''),
        // seller
        selling_entity_type:        answers.selling_entity_type        || undefined,
        selling_entity_legal_name:  answers.selling_entity_legal_name  || undefined,
        cac_rc_number:              answers.cac_rc_number              || undefined,
        // utilities & condition
        power_supply: answers.power_supply || undefined,
        water_supply: answers.water_supply || undefined,
        sewage:       answers.sewage       || undefined,
        road_access:  answers.road_access  || undefined,
        construction_status: answers.construction_status || undefined,
        condition:    answers.condition    || undefined,
        is_estate_unit: !!answers.is_estate_unit,
        estate_name:  answers.is_estate_unit ? (answers.estate_name || undefined) : undefined,
        // title / legal
        title_type:              answers.title_type              || undefined,
        title_file_no:           answers.title_file_no           || undefined,
        title_holder_name:       answers.title_holder_name       || undefined,
        title_issued_date:       answers.title_issued_date       || undefined,
        title_issuing_authority: answers.title_issuing_authority || undefined,
        // arrays
        amenities: reviewFields.amenities,
        images:    reviewFields.images,
        cover_image_url: reviewFields.images[0] || undefined,
      }

      await be.send('/listings', 'POST', payload)
      onCreated()
    } catch (e) {
      const raw = (e as Error).message
      // POST /listings requires a user-session JWT that the admin token doesn't provide.
      // Surface a human-readable explanation rather than the raw backend error.
      setSaveError(
        raw.includes("req.user") || raw.includes("'uid'")
          ? "The backend doesn't support direct admin listing creation yet. Please create this listing through the agency portal, then it will appear here automatically."
          : raw,
      )
    } finally {
      setSaving(false)
    }
  }

  const stepLabel =
    step === 'questions'  ? 'Step 1 of 2 — Property details' :
    step === 'generating' ? 'Generating content…' :
    'Step 2 of 2 — Review & edit'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/30 backdrop-blur-sm z-40 animate-fade-up"
        onClick={step !== 'generating' ? onClose : undefined}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider flex-shrink-0">
          <div>
            <p className="text-caption text-subtle uppercase tracking-wide font-semibold">{stepLabel}</p>
            <h3 className="text-h4 text-navy mt-0.5 flex items-center gap-2">
              <Sparkles size={16} className="text-action" strokeWidth={2} />
              AI Listing Creator
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'generating'}
            className="w-8 h-8 flex items-center justify-center rounded-button hover:bg-beige text-subtle hover:text-navy transition-colors disabled:opacity-30"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 pb-0 gap-2 flex-shrink-0">
          {(['questions', 'review'] as const).map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-colors duration-200 ${
                  step === 'review' && s === 'questions'
                    ? 'bg-verified text-white'
                    : step === s || (step === 'generating' && s === 'questions')
                    ? 'bg-action text-white'
                    : 'bg-divider text-subtle'
                }`}
              >
                {step === 'review' && s === 'questions' ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-caption font-semibold ${step === s ? 'text-navy' : 'text-subtle'}`}>
                {s === 'questions' ? 'Property details' : 'Review & edit'}
              </span>
              {i === 0 && <div className="flex-1 h-px bg-divider mx-1" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col overflow-hidden mt-2">
          {step === 'questions' && (
            <QuestionsStep
              answers={answers}
              onChange={setAnswers}
              onGenerate={handleGenerate}
              generating={false}
            />
          )}
          {step === 'generating' && <GeneratingStep />}
          {step === 'review' && (
            <ReviewStep
              fields={reviewFields}
              onChange={setReviewFields}
              onSubmit={handleSubmit}
              saving={saving}
              onBack={() => setStep('questions')}
              error={saveError}
            />
          )}
        </div>

        {/* AI error (shown in questions step) */}
        {aiError && step === 'questions' && (
          <div className="mx-6 mb-4 bg-danger-light border border-danger/20 text-danger text-body-sm rounded-card px-4 py-3 flex gap-2 flex-shrink-0">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
            {aiError}
          </div>
        )}
      </div>
    </>
  )
}
