import { NextResponse } from 'next/server'
import { setAgencySession } from '@/lib/agency-auth'

/**
 * Forwards { email, password } to propabridge-backend /agency/auth/login.
 *
 * Until that endpoint exists on the backend, this falls back to a dev-mode
 * gate using `AGENCY_DEV_PASSWORD` so the UI is reviewable end-to-end.
 */

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string
    password?: string
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  // 1. Dev-mode bypass check (prioritized for rapid UI development)
  const devPass = process.env.AGENCY_DEV_PASSWORD
  if (devPass && password === devPass) {
    setAgencySession(`dev:${email}`)
    return NextResponse.json({
      ok: true,
      agency: { name: email.split('@')[0], email },
      dev: true,
    })
  }

  // 2. Real backend check
  const base = process.env.PROPA_BACKEND_BASE
  if (base) {
    try {
      const res = await fetch(`${base}/agency/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) {
        const body = (await res.json()) as { token?: string; agency?: { name?: string } }
        if (body.token) {
          setAgencySession(body.token)
          return NextResponse.json({ ok: true, agency: body.agency || null })
        }
      }
      
      // If backend returned a specific error (e.g. 401), return it only if we didn't match devPass
      if (res.status !== 404) {
        const body = await res.json().catch(() => ({}))
        return NextResponse.json(
          { error: body.error || 'Invalid credentials' },
          { status: res.status },
        )
      }
    } catch (err) {
      console.error('[Agency Login Proxy Error]', err)
    }
  }

  return NextResponse.json(
    {
      error: devPass 
        ? 'Invalid credentials' 
        : 'Agency login not yet wired on backend. Set AGENCY_DEV_PASSWORD in .env.local for preview.',
    },
    { status: 401 },
  )
}
