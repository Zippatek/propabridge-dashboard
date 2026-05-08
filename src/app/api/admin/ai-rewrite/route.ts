import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

OUTPUT FORMAT — respond with ONE JSON object only, no prose, no markdown fences:
{
  "description": "<detailed Markdown description — see structure below>",
  "summary": "<one sentence under 160 chars, factual>",
  "search_keywords": ["lowercase","short","tokens","6-15 of them"]
}

DESCRIPTION STRUCTURE (use Markdown headings and formatting):
Produce a well-structured Markdown description with these sections (omit any section if the row lacks data for it):

## Overview
One clear paragraph: property type, bedrooms/bathrooms if residential, size, location (city + neighborhood), listing type, price and currency. Construction status and condition if set.

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
    line('payment_plan', p.payment_plan),
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
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
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

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserPrompt(property) }],
    })
    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI response did not contain JSON', raw: text }, { status: 500 })
    }
    let parsed: RewriteResult
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Could not parse AI JSON', raw: text }, { status: 500 })
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
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
