import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * POST /api/admin/check-doc-duplicate
 * Body: { documentUrl: string, listingId: string }
 *
 * Downloads the document, computes its SHA-256, then asks the backend whether
 * the same hash has appeared on a different listing. Returns:
 *   { duplicate: false }
 *   { duplicate: true, previous_listing_id: string, previous_url: string }
 *
 * Also stores the hash on first-seen so future uploads can be matched.
 */

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.PROPA_BACKEND_BASE
  const token = process.env.PROPA_BACKEND_ADMIN_TOKEN
  if (!base || !token) {
    return NextResponse.json({ error: 'Backend not configured' }, { status: 500 })
  }

  let body: { documentUrl?: string; listingId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { documentUrl, listingId } = body
  if (!documentUrl || !listingId) {
    return NextResponse.json({ error: 'documentUrl and listingId are required' }, { status: 400 })
  }

  try {
    // Download the document and compute SHA-256.
    const docRes = await fetch(documentUrl)
    if (!docRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch document (${docRes.status})` },
        { status: 400 },
      )
    }
    const buf = await docRes.arrayBuffer()
    const sha256 = createHash('sha256').update(Buffer.from(buf)).digest('hex')

    // Ask the backend to check + record the hash.
    const backendRes = await fetch(`${base}/listings/title-doc-hash`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify({ sha256, listing_id: listingId, document_url: documentUrl }),
      cache: 'no-store',
    })

    const data = await backendRes.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendRes.status })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
