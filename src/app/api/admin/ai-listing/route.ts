import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdminAuthed } from '@/lib/admin-auth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── Comprehensive question set (mirrors the agency listing wizard) ──────────

export interface AiListingAnswers {
  // basics
  property_type: string
  listing_type: string         // 'sale' | 'rent' | 'shortlet'
  intent?: string              // 'for_sale' | 'for_rent' | 'off_plan'
  bedrooms: string
  bathrooms: string
  size_sqm?: string            // built-up area
  declared_plot_size_sqm?: string
  price: string                // asking price NGN

  // location
  location: string             // free-text neighbourhood/city description
  address_line?: string
  city?: string
  neighborhood?: string
  cadastral_zone?: string
  plot_number?: string
  latitude?: string
  longitude?: string
  polygon_geojson?: string

  // title
  title_type?: string
  title_file_no?: string
  title_holder_name?: string
  title_issued_date?: string
  title_issuing_authority?: string

  // pricing & terms
  payment_plan?: string
  service_charge_ngn_per_year?: string
  propabridge_commission_pct?: string
  attribution_window_months?: string

  // seller
  selling_entity_type?: string
  selling_entity_legal_name?: string
  cac_rc_number?: string

  // utilities & condition
  power_supply?: string
  water_supply?: string
  sewage?: string
  road_access?: string
  construction_status?: string
  condition?: string
  is_estate_unit?: boolean
  estate_name?: string

  // amenities & narrative
  amenities?: string[]
  key_features: string
  additional_points?: string
  units_available?: string
}

export interface AiListingResponse {
  description: string
  fields: {
    title: string
    slug: string
    city: string
    neighborhood?: string
    address?: string
    listing_type: string
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    size_sqm: number | null
    price: number | null
    amenities?: string[]
    latitude?: number | null
    longitude?: number | null
    units_available?: number | null
  }
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(a: AiListingAnswers): string {
  const line = (label: string, val: unknown) =>
    val === undefined || val === null || val === '' ? null : `- ${label}: ${val}`

  const facts = [
    line('Property type', a.property_type),
    line('Listing type', a.listing_type),
    line('Intent', a.intent),
    line('Location / Neighbourhood', a.location),
    line('Address', a.address_line),
    line('City', a.city),
    line('Neighborhood', a.neighborhood),
    line('Cadastral zone', a.cadastral_zone),
    line('Plot number', a.plot_number),
    line('Latitude', a.latitude),
    line('Longitude', a.longitude),
    line('Bedrooms', a.bedrooms),
    line('Bathrooms', a.bathrooms),
    line('Built-up size (sqm)', a.size_sqm),
    line('Plot size (sqm)', a.declared_plot_size_sqm),
    line('Asking price (₦)', a.price),
    line('Payment plan', a.payment_plan),
    line('Service charge (₦/yr)', a.service_charge_ngn_per_year),
    line('Construction status', a.construction_status),
    line('Condition', a.condition),
    line('Power supply', a.power_supply),
    line('Water supply', a.water_supply),
    line('Sewage', a.sewage),
    line('Road access', a.road_access),
    line('Estate unit', a.is_estate_unit ? 'yes' : undefined),
    line('Estate name', a.estate_name),
    line('Title type', a.title_type),
    line('Title file no.', a.title_file_no),
    line('Title holder', a.title_holder_name),
    line('Selling entity', a.selling_entity_legal_name),
    line('Selling entity type', a.selling_entity_type),
    line('Amenities', a.amenities && a.amenities.length ? a.amenities.join(', ') : undefined),
    line('Key features', a.key_features),
    line('Additional selling points', a.additional_points),
    line('Units available', a.units_available),
  ].filter(Boolean).join('\n')

  return `You are an expert Nigerian real estate copywriter with deep knowledge of the Lagos, Abuja, and Port Harcourt property markets. Your writing is persuasive, sophisticated, and speaks directly to high-net-worth buyers and investors. You blend aspirational lifestyle language with concrete property specifications.

A property listing needs to be created with the following details:

${facts}

Your task:
1. Write a polished, compelling property description in **Markdown format** using these sections:
   ## Overview — property type, bedrooms/bathrooms, size, location, listing type, price
   ## Key Features — bullet list of standout specs and selling points
   ## Location Highlights — neighborhood or city context
   ## Investment Potential — (only for sale/off-plan) why this is a strong investment
   ## Amenities — bullet list from the amenities provided (omit if none)
   ## Units Available — (only if units_available is set) state remaining units
   
   Reference the title type, payment plan, utilities, construction status throughout where present. Write for discerning Nigerian buyers and diaspora investors. Total length: 250–450 words.

2. After the description, output a JSON block with suggested structured fields. Infer the city if not explicitly given. Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars). Use these exact keys.

Format your response EXACTLY like this — description first, then the JSON block:

[DESCRIPTION]
...your markdown description here...
[/DESCRIPTION]

[FIELDS]
{
  "title": "string — concise, compelling listing title (max 70 chars)",
  "slug": "string — url-friendly slug",
  "city": "string — city name only (e.g. Lagos, Abuja, Port Harcourt)",
  "neighborhood": "string or empty",
  "address": "string or empty",
  "listing_type": "sale | rent | shortlet",
  "property_type": "apartment | house | duplex | bungalow | land | commercial | villa | penthouse",
  "bedrooms": number or null,
  "bathrooms": number or null,
  "size_sqm": number or null,
  "price": number (numeric value only) or null,
  "amenities": ["array","of","short","amenity","strings"],
  "latitude": number or null,
  "longitude": number or null,
  "units_available": number or null
}
[/FIELDS]`
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let answers: AiListingAnswers
  try {
    const body = await req.json()
    answers = body.answers as AiListingAnswers
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3072,
      messages: [{ role: 'user', content: buildPrompt(answers) }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const descMatch = text.match(/\[DESCRIPTION\]([\s\S]*?)\[\/DESCRIPTION\]/)
    const fieldsMatch = text.match(/\[FIELDS\]([\s\S]*?)\[\/FIELDS\]/)

    if (!descMatch || !fieldsMatch) {
      return NextResponse.json({ error: 'AI response format error — could not parse sections' }, { status: 500 })
    }

    const description = descMatch[1].trim()
    let fields: AiListingResponse['fields']
    try {
      fields = JSON.parse(fieldsMatch[1].trim())
    } catch {
      return NextResponse.json({ error: 'AI response format error — could not parse fields JSON' }, { status: 500 })
    }

    const result: AiListingResponse = { description, fields }
    return NextResponse.json(result)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
