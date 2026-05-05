import { NextResponse } from 'next/server'
import { setAgencySession } from '@/lib/agency-auth'

/**
 * Proxy: POST /api/agency/accept-invite → backend /agency/accept-invite
 *
 * Public endpoint — no auth token required (the invite token IS the credential).
 * On success, sets the httpOnly agency session cookie server-side so the user
 * lands logged-in on /agency. The cookie name must match what middleware
 * reads (propa_agency_session) — never set agency cookies from the client.
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

    if (upstream.ok && data?.token) {
      setAgencySession(data.token)
      // Strip the raw token from the response — the client doesn't need it
      // and shouldn't see it (it's now in an httpOnly cookie).
      const { token: _t, ...safe } = data
      return NextResponse.json(safe, { status: upstream.status })
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || 'Network error' },
      { status: 502 },
    )
  }
}
