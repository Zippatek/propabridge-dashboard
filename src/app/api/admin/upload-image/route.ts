import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * Proxy: POST /api/admin/upload-image  →  POST <backend>/listings/uploads/image
 *
 * Forwards a multipart/form-data file to the backend admin upload endpoint
 * with the x-admin-token header attached server-side. Lets the AI Listing
 * Creator drawer upload images without exposing the admin token to the
 * browser.
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

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  }

  // Stream the body straight through with the original content-type so the
  // multipart boundary is preserved.
  const buf = await req.arrayBuffer()
  const res = await fetch(`${base}/listings/uploads/image`, {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'x-admin-token': token,
    },
    body: buf,
    cache: 'no-store',
  })

  const text = await res.text()
  let body: unknown = text
  try { body = text ? JSON.parse(text) : null } catch { /* keep text */ }
  return NextResponse.json(body ?? {}, { status: res.status })
}
