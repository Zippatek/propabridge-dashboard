import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { isAdminAuthed } from '@/lib/admin-auth'
import type {
  ClientFinding,
  TitleDocExtraction,
  TitleDocVerificationResult,
} from '@/lib/verification/findings'

/**
 * POST /api/admin/verify-title-doc
 * Body: {
 *   documentUrl: string,
 *   titleSnapshot: {
 *     title_type, title_file_no, title_holder_name,
 *     title_issuing_authority, title_issued_date
 *   }
 * }
 *
 * Runs Gemini Vision over an uploaded C of O / R of O / title document image,
 * extracts structured fields, and cross-checks against what the agent typed
 * into the listing form. Returns extraction + ClientFinding[] so the dashboard
 * can render mismatches inline.
 */

const EXTRACT_PROMPT = `You are auditing a Nigerian property title document (Certificate of Occupancy, Right of Occupancy, Governor's Consent, Deed of Assignment, Allocation Letter, or Customary title).

Extract the following fields from the image. Return ONLY a single JSON object — no prose, no markdown fences.

{
  "file_number": string | null,            // e.g. "MISC 12345" or "FCT/MLS/87654"
  "plot_number": string | null,            // plot / cadastral plot identifier
  "holder_name": string | null,            // person or company the title is issued to
  "issuing_authority": string | null,      // e.g. "Federal Capital Territory Administration", "Minister of the FCT"
  "issued_date": string | null,            // ISO YYYY-MM-DD if discernible
  "title_type": "c_of_o" | "r_of_o" | "governors_consent" | "deed_of_assignment" | "customary" | "allocation_letter" | null,
  "has_visible_stamp": boolean,            // any visible official stamp/seal
  "has_qr_code": boolean,                  // newer FCT documents carry a QR code
  "tampering_signals": string[],           // short phrases describing anything suspicious: edited regions, inconsistent fonts, missing/illegible stamp, photocopy-of-photocopy quality, signature anomalies, etc. Empty array if none.
  "confidence": number                     // 0.0–1.0, overall confidence in extraction
}

If you cannot read a field, return null for it (do not invent). Do not include any field not listed above.`

const TITLE_TYPE_LABELS: Record<string, string> = {
  c_of_o: 'Certificate of Occupancy',
  r_of_o: 'Right of Occupancy',
  governors_consent: "Governor's Consent",
  deed_of_assignment: 'Deed of Assignment',
  customary: 'Customary',
  allocation_letter: 'Allocation Letter',
}

async function fetchAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch document (${res.status})`)
  const mimeType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = await res.arrayBuffer()
  const data = Buffer.from(buffer).toString('base64')
  return { data, mimeType }
}

function safeParseJson(text: string): unknown {
  // Strip ```json fences if Gemini added any despite the instruction.
  const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  try {
    return JSON.parse(stripped)
  } catch {
    // Last-ditch: find the first { ... } block.
    const m = stripped.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { /* fall through */ }
    }
    return null
  }
}

function normalize(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function comparator(
  extraction: TitleDocExtraction,
  snapshot: {
    title_type?: string | null
    title_file_no?: string | null
    title_holder_name?: string | null
    title_issuing_authority?: string | null
    title_issued_date?: string | null
  },
): ClientFinding[] {
  const findings: ClientFinding[] = []

  const compareField = (
    code: string,
    label: string,
    declared: string | null | undefined,
    extracted: string | null | undefined,
    severityOnMismatch: 'block' | 'flag' = 'flag',
  ) => {
    const d = normalize(declared)
    const e = normalize(extracted)
    if (!d && !e) return
    if (!d) {
      findings.push({
        code,
        severity: 'flag',
        state: 'fail',
        message: `${label} present on document but missing from the listing form (document says "${extracted}").`,
        details: { declared, extracted },
      })
      return
    }
    if (!e) {
      findings.push({
        code,
        severity: 'flag',
        state: 'inconclusive',
        message: `${label} typed as "${declared}" but could not be read from the document.`,
        details: { declared, extracted },
      })
      return
    }
    // Loose match: one string contains the other.
    const match = d === e || d.includes(e) || e.includes(d)
    findings.push({
      code,
      severity: match ? 'info' : severityOnMismatch,
      state: match ? 'pass' : 'fail',
      message: match
        ? `${label} matches between form and document.`
        : `${label} mismatch: form says "${declared}", document says "${extracted}".`,
      details: { declared, extracted },
    })
  }

  compareField('title.file_no', 'Title file number', snapshot.title_file_no, extraction.file_number, 'block')
  compareField('title.holder_name', 'Title holder name', snapshot.title_holder_name, extraction.holder_name, 'block')
  compareField('title.issuing_authority', 'Issuing authority', snapshot.title_issuing_authority, extraction.issuing_authority)
  compareField('title.issued_date', 'Issued date', snapshot.title_issued_date, extraction.issued_date)

  // Title type comparison uses code-to-label mapping.
  if (snapshot.title_type) {
    const declaredCode = snapshot.title_type
    const declaredLabel = TITLE_TYPE_LABELS[declaredCode] || declaredCode
    const extractedCode = extraction.title_type
    const match =
      !extractedCode ||
      extractedCode === declaredCode ||
      normalize(extractedCode) === normalize(declaredLabel)
    findings.push({
      code: 'title.type',
      severity: match ? 'info' : 'flag',
      state: match ? 'pass' : 'fail',
      message: match
        ? `Title type matches between form and document (${declaredLabel}).`
        : `Title type mismatch: form says "${declaredLabel}", document appears to be "${extractedCode}".`,
      details: { declared: declaredCode, extracted: extractedCode },
    })
  }

  // Stamp / QR signals.
  if (!extraction.has_visible_stamp) {
    findings.push({
      code: 'title.no_visible_stamp',
      severity: 'flag',
      state: 'fail',
      message: 'No visible official stamp / seal detected on the document.',
    })
  }

  // Tampering signals → one finding each, all flag-level (advisory).
  for (const sig of extraction.tampering_signals) {
    findings.push({
      code: 'title.tampering_signal',
      severity: 'flag',
      state: 'fail',
      message: `Possible tampering signal: ${sig}`,
    })
  }

  return findings
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

  let body: { documentUrl?: string; titleSnapshot?: Record<string, string | null> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { documentUrl, titleSnapshot } = body
  if (!documentUrl) {
    return NextResponse.json({ error: 'documentUrl is required' }, { status: 400 })
  }

  try {
    const { data, mimeType } = await fetchAsBase64(documentUrl)

    const genai = new GoogleGenerativeAI(apiKey)
    const visionModel = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'
    const model = genai.getGenerativeModel({
      model: visionModel,
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    })

    const result = await model.generateContent([
      EXTRACT_PROMPT,
      { inlineData: { data, mimeType } },
    ])

    const text = result.response.text()
    const parsed = safeParseJson(text)
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { error: 'Could not parse Gemini extraction', raw: text.slice(0, 500) },
        { status: 502 },
      )
    }

    const p = parsed as Record<string, unknown>
    const extraction: TitleDocExtraction = {
      file_number: (p.file_number as string) || null,
      plot_number: (p.plot_number as string) || null,
      holder_name: (p.holder_name as string) || null,
      issuing_authority: (p.issuing_authority as string) || null,
      issued_date: (p.issued_date as string) || null,
      title_type: (p.title_type as string) || null,
      has_visible_stamp: Boolean(p.has_visible_stamp),
      has_qr_code: Boolean(p.has_qr_code),
      tampering_signals: Array.isArray(p.tampering_signals)
        ? (p.tampering_signals as string[]).filter(s => typeof s === 'string')
        : [],
      confidence: typeof p.confidence === 'number' ? p.confidence : 0.5,
    }

    const findings = comparator(extraction, titleSnapshot || {})

    const out: TitleDocVerificationResult = { extraction, findings }
    return NextResponse.json(out)
  } catch (e) {
    const err = e as Error
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 })
  }
}
