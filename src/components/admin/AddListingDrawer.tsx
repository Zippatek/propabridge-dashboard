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
} from 'lucide-react'
import { be } from '@/lib/client-api'
import type { AiListingAnswers, AiListingResponse } from '@/app/api/admin/ai-listing/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddListingDrawerProps {
  onClose: () => void
  onCreated: () => void
}

type Step = 'questions' | 'generating' | 'review'

const LISTING_TYPES  = ['sale', 'rent', 'shortlet']
const PROPERTY_TYPES = ['apartment', 'house', 'duplex', 'bungalow', 'land', 'commercial', 'villa', 'penthouse']

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
  location: '',
  bedrooms: '',
  bathrooms: '',
  size_sqm: '',
  price: '',
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
  const set = (k: keyof AiListingAnswers, v: string) => onChange({ ...answers, [k]: v })

  const inputCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'

  const selectCls =
    'w-full px-3 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 appearance-none'

  const isValid = answers.location.trim() && answers.price.trim() && answers.key_features.trim()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Intro */}
        <div className="bg-action-light border border-action/20 rounded-card px-4 py-3 flex gap-3">
          <Sparkles size={16} className="text-action flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-body-sm text-navy">
            Answer a few questions and our AI will generate a polished listing description and pre-fill all fields.
          </p>
        </div>

        {/* Q1 + Q2 — property & listing type */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">
              1. Property type <span className="text-danger">*</span>
            </span>
            <div className="relative">
              <select className={selectCls} value={answers.property_type} onChange={e => set('property_type', e.target.value)}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">
              2. Listing type <span className="text-danger">*</span>
            </span>
            <div className="relative">
              <select className={selectCls} value={answers.listing_type} onChange={e => set('listing_type', e.target.value)}>
                {LISTING_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            </div>
          </label>
        </div>

        {/* Q3 — Location */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            3. Location / city &amp; neighbourhood <span className="text-danger">*</span>
          </span>
          <input
            className={inputCls}
            value={answers.location}
            onChange={e => set('location', e.target.value)}
            placeholder="e.g. Lekki Phase 1, Lagos"
          />
        </label>

        {/* Q4 — Beds & baths */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">4. Bedrooms</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={answers.bedrooms}
              onChange={e => set('bedrooms', e.target.value)}
              placeholder="e.g. 4"
            />
          </label>
          <label className="block">
            <span className="text-caption text-subtle font-semibold mb-1.5 block">Bathrooms</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={answers.bathrooms}
              onChange={e => set('bathrooms', e.target.value)}
              placeholder="e.g. 5"
            />
          </label>
        </div>

        {/* Q5 — Size */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">5. Size in sqm <span className="text-placeholder">(optional)</span></span>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={answers.size_sqm}
            onChange={e => set('size_sqm', e.target.value)}
            placeholder="e.g. 350"
          />
        </label>

        {/* Q6 — Price */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            6. Price (₦) <span className="text-danger">*</span>
          </span>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={answers.price}
            onChange={e => set('price', e.target.value)}
            placeholder="e.g. 450000000"
          />
        </label>

        {/* Q7 — Key features */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            7. Key features <span className="text-danger">*</span>
          </span>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            value={answers.key_features}
            onChange={e => set('key_features', e.target.value)}
            placeholder="e.g. 4 ensuite bedrooms, private study, rooftop terrace, BQ, 24hr security, generator, smart home..."
          />
        </label>

        {/* Q8 — Additional selling points */}
        <label className="block">
          <span className="text-caption text-subtle font-semibold mb-1.5 block">
            8. Additional selling points <span className="text-placeholder">(optional)</span>
          </span>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            value={answers.additional_points}
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
  listing_type: string
  property_type: string
  bedrooms: string
  bathrooms: string
  size_sqm: string
  price: string
  description: string
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
                {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
    listing_type: 'sale',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    size_sqm: '',
    price: '',
    description: '',
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
        city:          f.city  || '',
        listing_type:  f.listing_type  || answers.listing_type,
        property_type: f.property_type || answers.property_type,
        bedrooms:      f.bedrooms  != null ? String(f.bedrooms)  : answers.bedrooms,
        bathrooms:     f.bathrooms != null ? String(f.bathrooms) : answers.bathrooms,
        size_sqm:      f.size_sqm  != null ? String(f.size_sqm)  : (answers.size_sqm || ''),
        price:         f.price     != null ? String(f.price)     : answers.price,
        description:   data.description,
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
      const payload: Record<string, unknown> = {
        title:         reviewFields.title         || undefined,
        slug:          reviewFields.slug          || undefined,
        city:          reviewFields.city          || undefined,
        listing_type:  reviewFields.listing_type,
        property_type: reviewFields.property_type,
        description:   reviewFields.description   || undefined,
      }
      if (reviewFields.price     !== '') payload.price     = Number(reviewFields.price)
      if (reviewFields.bedrooms  !== '') payload.bedrooms  = Number(reviewFields.bedrooms)
      if (reviewFields.bathrooms !== '') payload.bathrooms = Number(reviewFields.bathrooms)
      if (reviewFields.size_sqm  !== '') payload.size_sqm  = Number(reviewFields.size_sqm)

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
