import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * POST /api/admin/manual-footprint-check
 * Body: { latitude, longitude, polygon_geojson, property_type }
 *
 * Proxies a manual (ad-hoc) footprint check to the backend. Unlike the
 * listing-based endpoint, this doesn't require an existing listing — the admin
 * provides raw coordinates / polygon and the backend queries PostGIS directly.
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

  let body: {
    latitude?: number | null
    longitude?: number | null
    polygon_geojson?: string | null
    property_type?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const res = await fetch(`${base}/admin/manual-footprint-check`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
