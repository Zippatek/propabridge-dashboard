import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { beFetch, ApiError } from '@/lib/api'

/**
 * World-class property content rewriter.
 *
 *   POST /api/admin/ai-rewrite
 *     body { propertyId | listingId }            → fetches row from backend
 *     body { property: <row> }                   → uses inline row
 *
 * Returns { description, summary, search_keywords } regenerated from the
 * structured fields on the row. Strict no-hallucination prompt.
 *
 * Does NOT persist — the dashboard previews `before` vs `after` then PATCHes
 * the listing itself via /api/admin/be/listings/:id when the admin accepts.
 */

const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function getGeminiApiKey(): string {
  return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
}

function geminiAiRewriteModel(): string {
  return String(process.env.GEMINI_AI_REWRITE_MODEL || '').trim() || 'gemini-2.0-flash-lite'
}

/**
 * Strip common ``` / ```json fences around model output before JSON.parse.
 */
function stripModelJsonFences(raw: string): string {
  let t = String(raw || '').trim()
  if (!t.startsWith('```')) return t
  t = t.replace(/^```(?:json|JSON)?\s*\r?\n?/, '')
  const close = t.lastIndexOf('```')
  if (close !== -1) t = t.slice(0, close)
  return t.trim()
}

/**
 * Pull first top-level `{ ... }` block from normalized text (handles minor fence noise).
 */
function extractJsonObjectString(text: string): string | null {
  const cleaned = stripModelJsonFences(text)
  const m = cleaned.match(/\{[\s\S]*\}/)
  return m ? m[0] : null
}

function geminiResponseText(respJson: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}): string {
  const parts = respJson?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('').trim()
}

async function geminiGenerateContent({
  model,
  systemInstruction,
  userText,
  maxOutputTokens,
}: {
  model: string
  systemInstruction: string
  userText: string
  maxOutputTokens: number
}): Promise<
  | { ok: true; text: string }
  | { ok: false; status: number; bodyText: string; error?: string }
> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return { ok: false, status: 0, bodyText: '', error: 'no_api_key' }
  }
  const url = `${GEMINI_REST_BASE}/${encodeURIComponent(model)}:generateContent`
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })
    const bodyText = await res.text().catch(() => '')
    if (!res.ok) {
      return { ok: false, status: res.status, bodyText }
    }
    let json: unknown
    try {
      json = JSON.parse(bodyText)
    } catch {
      return { ok: false, status: res.status, bodyText: 'Invalid JSON from Gemini' }
    }
    const text = geminiResponseText(json as Parameters<typeof geminiResponseText>[0])
    if (!text) {
      return { ok: false, status: res.status, bodyText: bodyText.slice(0, 400) }
    }
    return { ok: true, text }
  } catch (e) {
    const err = e as Error
    return { ok: false, status: 0, bodyText: err.message || String(e) }
  }
}

interface PropertyRow {
  id?: string | number
  title?: string | null
  slug?: string | null
  city?: string | null
  neighborhood?: string | null
  address?: string | null
  listing_type?: string | null
  property_type?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  size_sqm?: number | null
  built_up_area_sqm?: number | null
  declared_plot_size_sqm?: number | null
  price?: number | null
  currency?: string | null
  description?: string | null
  amenities?: string[] | null
  construction_status?: string | null
  condition?: string | null
  payment_plan?: string | null
  title_type?: string | null
  power_supply?: string | null
  water_supply?: string | null
  road_access?: string | null
  is_estate_unit?: boolean | null
  estate_name?: string | null
  intent?: string | null
  units_available?: number | null
}

const SYSTEM = `You are a world-class Nigerian real-estate copywriter. Your output replaces the existing description on a live listing.

HARD CONSTRAINTS — NEVER VIOLATE:
- Use ONLY facts present in the provided row. Never invent neighborhoods, prices, amenities, sizes, distances to landmarks, dates, or any other detail.
- No AI-flavored phrasing ("nestled in", "boasts", "step into a world", "discover the pinnacle", "elevate your lifestyle", "unparalleled", "epitome of"). Plain, confident, human Nigerian-realtor tone.
- If a fact is missing, simply omit it — do NOT speculate or hedge with "approximately".
- Ensure the distinction between "Verified" and non-verified properties. Do not claim a property is verified unless explicitly stated in the row.

OUTPUT FORMAT — respond with ONE JSON object only, no prose, no markdown fences:
{
  "description": "<detailed Markdown description — see structure below>",
  "summary": "<one sentence under 160 chars, factual>",
  "search_keywords": ["lowercase","short","tokens","6-15 of them"]
}

DESCRIPTION STRUCTURE (use Markdown headings and formatting):
Produce a well-structured Markdown description with these sections (omit any section if the row lacks data for it):

GFM TABLES — readability (required habit, not optional fluff):
- Include GitHub-Flavored Markdown **pipe tables** wherever they make specs easier to scan than prose — e.g. bedrooms, bathrooms, floors (if known), built-up vs plot areas (sqm), parking, estate/unit flags, listing type/price band as rows/columns **only when backed by the row**.
- Use tables for **feature matrices** or compact **comparison-style** layouts (e.g. Attribute | Detail; or amenity/feature × Present / Notes) using facts from the row only.
- Prefer **## / ### headings**, **bullet lists**, and **tables** together; avoid long walls of uninterrupted paragraphs for numeric or categorical specs.
- Valid GFM only: header row, separator line (\`|---|\`), then body rows. The public site renders descriptions with **remark-gfm** (same Markdown dialect as GitHub).

LEGAL HEADINGS — required:
- In every \`##\` / \`###\` heading and in first mentions in prose, use **full formal English** for legal title types — e.g. "Certificate of Occupancy", "Right of Occupancy", "Governor's Consent", "Deed of Assignment", "Allocation letter". Do **not** use internal codes (\`c_of_o\`, \`r_of_o\`, etc.), slug-style tokens, or sloppy abbreviations like "C of O" / "c of o" / "R of O" **in any heading**. After the full term appears once, shorter references like "the title" or "the certificate" are fine.

## Overview
One clear paragraph: property type, bedrooms/bathrooms if residential, size, location (city + neighborhood), listing type, price and currency. Construction status and condition if set.

## Key specs (table encouraged)
Where multiple numeric or categorical specs apply, lead with a compact GFM table (Attribute | Value), then optional bullets for narrative selling points — all strictly from the row.

## Key Features
Bullet list of the property's most important specs and unique selling points drawn strictly from the row fields.

## Location Highlights
Concise paragraph on the city/neighborhood based solely on what is in the row. Do not fabricate landmarks.

## Investment Potential
Only include if the listing type is sale, for_sale, or off_plan. One short paragraph on why this is a compelling investment based on the facts in the row.

## Amenities
Bullet list of amenities from the amenities field only. If amenities is empty, omit this section.

## Units Available
Only include if units_available is set and greater than 0. State the number of units remaining.

Keep the full description between 200–400 words.`

function humanTitleType(raw: string | null | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  const t = raw.trim().toLowerCase().replace(/\s+/g, '_')
  const map: Record<string, string> = {
    c_of_o: 'Certificate of Occupancy',
    r_of_o: 'Right of Occupancy',
    governors_consent: "Governor's Consent",
    deed_of_assignment: 'Deed of Assignment',
    customary: 'Customary title',
    allocation_letter: 'Allocation letter',
  }
  return map[t] ?? raw.trim()
}

function humanPaymentPlan(raw: string | null | undefined): string | undefined {
  if (!raw?.trim()) return undefined
  const t = raw.trim().toLowerCase()
  const map: Record<string, string> = {
    outright: 'Outright purchase',
    installment: 'Installment payment',
    mortgage: 'Mortgage',
    off_plan_milestones: 'Off-plan milestone payments',
  }
  return map[t] ?? raw.trim().replace(/_/g, ' ')
}

function buildUserPrompt(p: PropertyRow): string {
  const line = (k: string, v: unknown) =>
    v === undefined || v === null || v === '' ? null : `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
  const facts = [
    line('id', p.id),
    line('title', p.title),
    line('city', p.city),
    line('neighborhood', p.neighborhood),
    line('address', p.address),
    line('listing_type', p.listing_type),
    line('property_type', p.property_type),
    line('intent', p.intent),
    line('bedrooms', p.bedrooms),
    line('bathrooms', p.bathrooms),
    line('size_sqm', p.size_sqm),
    line('built_up_area_sqm', p.built_up_area_sqm),
    line('declared_plot_size_sqm', p.declared_plot_size_sqm),
    line('price', p.price),
    line('currency', p.currency || 'NGN'),
    line('payment_plan', humanPaymentPlan(p.payment_plan)),
    line('title_type', humanTitleType(p.title_type)),
    line('construction_status', p.construction_status),
    line('condition', p.condition),
    line('power_supply', p.power_supply),
    line('water_supply', p.water_supply),
    line('road_access', p.road_access),
    line('is_estate_unit', p.is_estate_unit ? 'yes' : null),
    line('estate_name', p.estate_name),
    line(
      'amenities',
      Array.isArray(p.amenities) && p.amenities.length ? p.amenities.join(', ') : null,
    ),
    line('units_available', p.units_available ?? null),
    line('existing_description', p.description ? String(p.description).slice(0, 1200) : null),
  ]
    .filter(Boolean)
    .join('\n')
  return `Rewrite the description for this property using ONLY the facts below.\n\n${facts}`
}

interface BeListing { listing?: PropertyRow } // GET /listings/:id shape
type BeRespone = PropertyRow | BeListing

async function loadProperty(id: string): Promise<PropertyRow> {
  const data = await beFetch<BeRespone>(`/listings/${encodeURIComponent(id)}`)
  if (data && typeof data === 'object' && 'listing' in data && data.listing) {
    return data.listing
  }
  return data as PropertyRow
}

interface RewriteResult {
  description: string
  summary: string
  search_keywords: string[]
}

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { propertyId?: string; listingId?: string; property?: PropertyRow }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let property: PropertyRow | null = body.property ?? null
  if (!property) {
    const id = body.propertyId || body.listingId
    if (!id) {
      return NextResponse.json({ error: 'propertyId, listingId, or property is required' }, { status: 400 })
    }
    try {
      property = await loadProperty(String(id))
    } catch (e) {
      const err = e as ApiError
      return NextResponse.json({ error: err.message || 'Failed to load property' }, { status: err.status || 500 })
    }
  }

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    const msg =
      'Gemini API key is not configured on the server. Set GEMINI_API_KEY or GOOGLE_API_KEY for listing rewrites.'
    return NextResponse.json({ error: msg, message: msg }, { status: 503 })
  }

  try {
    const gen = await geminiGenerateContent({
      model: geminiAiRewriteModel(),
      systemInstruction: SYSTEM,
      userText: buildUserPrompt(property),
      maxOutputTokens: 8192,
    })

    if (!gen.ok) {
      if (gen.error === 'no_api_key') {
        const msg =
          'Gemini API key is not configured on the server. Set GEMINI_API_KEY or GOOGLE_API_KEY for listing rewrites.'
        return NextResponse.json({ error: msg, message: msg }, { status: 503 })
      }
      const upstream =
        gen.status === 429 || gen.status === 503
          ? 503
          : gen.status === 0 || gen.status >= 500
            ? 502
            : 502
      const readable =
        gen.status === 0
          ? 'Could not reach the Gemini API from the server.'
          : `Gemini returned an error (HTTP ${gen.status}). Try again shortly.`
      return NextResponse.json(
        {
          error: readable,
          message: readable,
        },
        { status: upstream },
      )
    }

    const jsonSlice = extractJsonObjectString(gen.text)
    if (!jsonSlice) {
      const msg = 'AI response did not contain usable JSON.'
      return NextResponse.json({ error: msg, message: msg, raw: gen.text.slice(0, 2000) }, { status: 502 })
    }
    let parsed: RewriteResult
    try {
      parsed = JSON.parse(jsonSlice)
    } catch {
      const msg = 'Could not parse AI JSON output.'
      return NextResponse.json({ error: msg, message: msg, raw: jsonSlice.slice(0, 2000) }, { status: 502 })
    }
    const out: RewriteResult = {
      description: String(parsed.description || '').trim(),
      summary: String(parsed.summary || '').trim().slice(0, 160),
      search_keywords: Array.isArray(parsed.search_keywords)
        ? parsed.search_keywords
            .map(k => String(k).trim().toLowerCase())
            .filter(k => k.length > 0)
            .slice(0, 20)
        : [],
    }
    return NextResponse.json({
      ...out,
      before: {
        description: property.description ?? '',
      },
    })
  } catch (e) {
    const err = e as Error
    const msg = err.message || 'AI generation failed'
    return NextResponse.json({ error: msg, message: msg }, { status: 500 })
  }
}
