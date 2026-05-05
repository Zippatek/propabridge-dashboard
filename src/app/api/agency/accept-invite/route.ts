import { NextResponse } from 'next/server'

/**
 * Proxy: POST /api/agency/accept-invite → backend /agency/accept-invite
 * Public endpoint — no auth token required (invite token is the credential).
 */

const BASE = process.env.PROPA_BACKEND_BASE || ''

export async function POST(req: Request) {
  if (!BASE) {
    return NextResponse.json(
      { error: 'PROPA_BACKEND_BASE not configured' },
      { status: 500 },
    )
  }

  try {
    const body = await req.json()
    const upstream = await fetch(`${BASE}/agency/accept-invite`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'Network error' },
      { status: 502 },
    )
  }
}
