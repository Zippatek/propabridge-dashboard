import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { isAdminAuthed } from '@/lib/admin-auth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface AiListingAnswers {
  property_type: string
  listing_type: string
  location: string
  bedrooms: string
  bathrooms: string
  size_sqm?: string
  price: string
  key_features: string
  additional_points?: string
}

export interface AiListingResponse {
  description: string
  fields: {
    title: string
    slug: string
    city: string
    listing_type: string
    property_type: string
    bedrooms: number | null
    bathrooms: number | null
    size_sqm: number | null
    price: number | null
  }
}

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

  const prompt = `You are an expert Nigerian real estate copywriter with deep knowledge of the Lagos, Abuja, and Port Harcourt property markets. Your writing is persuasive, sophisticated, and speaks directly to high-net-worth buyers and investors. You blend aspirational lifestyle language with concrete property specifications.

A property listing needs to be created with the following details provided by the agency:

- Property type: ${answers.property_type}
- Listing type: ${answers.listing_type}
- Location / Neighbourhood: ${answers.location}
- Bedrooms: ${answers.bedrooms}
- Bathrooms: ${answers.bathrooms}
${answers.size_sqm ? `- Size: ${answers.size_sqm} sqm` : ''}
- Price: ₦${answers.price}
- Key features: ${answers.key_features}
${answers.additional_points ? `- Additional selling points: ${answers.additional_points}` : ''}

Your task:
1. Write a polished, compelling property description in **Markdown format** (use ## for section headings, **bold** for key specs, bullet lists for features). The description should be 3–5 paragraphs long with a features section. Write in a tone that appeals to discerning Nigerian buyers and diaspora investors.

2. After the description, output a JSON block with suggested structured fields. Infer the city from the location. Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars). Use these exact keys.

Format your response EXACTLY like this — description first, then the JSON block:

[DESCRIPTION]
...your markdown description here...
[/DESCRIPTION]

[FIELDS]
{
  "title": "string — concise, compelling listing title (max 60 chars)",
  "slug": "string — url-friendly slug",
  "city": "string — city name only (e.g. Lagos, Abuja, Port Harcourt)",
  "listing_type": "sale | rent | shortlet",
  "property_type": "apartment | house | duplex | bungalow | land | commercial | villa | penthouse",
  "bedrooms": number or null,
  "bathrooms": number or null,
  "size_sqm": number or null,
  "price": number (numeric value only, no commas or currency symbols) or null
}
[/FIELDS]`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
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
