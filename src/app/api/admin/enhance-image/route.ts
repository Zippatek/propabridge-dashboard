import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * POST /api/admin/enhance-image
 * Body: { imageUrl: string }
 *
 * Calls a Gemini image-capable model (default gemini-2.5-flash-image) to
 * enhance a property photo. Returns { enhancedImageUrl: string } (base64 data URL).
 *
 * Non-destructive: the original is never modified; the caller chooses whether
 * to replace it.
 */

const ENHANCE_PROMPT =
  'Enhance this property photo: improve lighting, clarity, and visual appeal ' +
  'while keeping the exact same scene, architecture, and composition. ' +
  'Do not invent or add anything not in the original image.'

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url}`)
  const mimeType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = await res.arrayBuffer()
  const data = Buffer.from(buffer).toString('base64')
  return { data, mimeType }
}

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey =
    process.env.GOOGLE_CLOUD_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No Gemini API key configured (set GOOGLE_CLOUD_API_KEY or GEMINI_API_KEY)' },
      { status: 500 },
    )
  }

  let body: { imageUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { imageUrl } = body
  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  try {
    const { data, mimeType } = await fetchImageAsBase64(imageUrl)

    const genai = new GoogleGenerativeAI(apiKey)
    const imageModel =
      process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'

    const model = genai.getGenerativeModel({
      model: imageModel,
      // Image-out models require an explicit modality; omitted types in @google/generative-ai.
      generationConfig: {
        temperature: 0.35,
        responseModalities: ['IMAGE'],
      } as Record<string, unknown>,
    })

    const result = await model.generateContent([
      ENHANCE_PROMPT,
      {
        inlineData: {
          data,
          mimeType,
        },
      },
    ])

    const response = result.response
    const parts = response.candidates?.[0]?.content?.parts ?? []

    // Find inline image data in response
    const imagePart = parts.find(
      (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
    ) as { inlineData: { data: string; mimeType: string } } | undefined

    if (!imagePart) {
      // Fallback: model may not support image generation on this key tier
      return NextResponse.json(
        {
          error:
            'Gemini did not return an enhanced image. ' +
            'Confirm GEMINI_IMAGE_MODEL / API key access for native image output.',
        },
        { status: 502 },
      )
    }

    const enhancedDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
    return NextResponse.json({ enhancedImageUrl: enhancedDataUrl })
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message || 'Image enhancement failed' }, { status: 500 })
  }
}
