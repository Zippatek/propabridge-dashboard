import { NextResponse } from 'next/server'

type ProxyOpts = {
  /** e.g. `/listings/uploads/plan` */
  backendPath: string
}

/**
 * POST multipart from the browser to the api-gateway upload route, attaching
 * x-admin-token server-side. Surfaces connection failures as JSON 503.
 */
export async function proxyMultipartUpload(req: Request, { backendPath }: ProxyOpts) {
  const base = (process.env.PROPA_BACKEND_BASE || '').trim()
  const token = (process.env.PROPA_BACKEND_ADMIN_TOKEN || '').trim()
  if (!base || !token) {
    return NextResponse.json(
      {
        error:
          'Backend not configured: set PROPA_BACKEND_BASE and PROPA_BACKEND_ADMIN_TOKEN (e.g. in .env.local), then restart Next.js.',
      },
      { status: 503 },
    )
  }

  const contentType = req.headers.get('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  }

  try {
    const buf = await req.arrayBuffer()
    const res = await fetch(`${base.replace(/\/+$/, '')}${backendPath}`, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        'x-admin-token': token,
      },
      body: buf,
      cache: 'no-store',
    })

    const text = await res.text()
    let body: Record<string, unknown> = {}
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          body = parsed as Record<string, unknown>
        } else {
          body = { error: String(parsed) }
        }
      } catch {
        body = { error: text.slice(0, 500) || `Upstream HTTP ${res.status}` }
      }
    } else if (!res.ok) {
      body = { error: `Upstream HTTP ${res.status}` }
    }

    return NextResponse.json(body, { status: res.status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { error: `Could not reach listing backend (${base}): ${msg}` },
      { status: 503 },
    )
  }
}
