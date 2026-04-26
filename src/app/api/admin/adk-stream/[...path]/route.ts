import { isAdminAuthed } from '@/lib/admin-auth'

/**
 * Streaming proxy for propabridge-adk SSE endpoints.
 *   /api/admin/adk-stream/conversations/{id}/stream
 *   /api/admin/adk-stream/sessions/stream
 *
 * The upstream x-admin-key is injected server-side so EventSource on the
 * browser only ever sees this app's cookie auth.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request, ctx: { params: { path: string[] } }) {
  if (!isAdminAuthed()) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const base = process.env.PROPA_ADK_BASE
  const key = process.env.PROPA_ADK_ADMIN_KEY
  if (!base || !key) {
    return new Response(
      JSON.stringify({ error: 'PROPA_ADK_BASE / PROPA_ADK_ADMIN_KEY not configured' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  const { search } = new URL(req.url)
  const upstreamUrl = `${base}/api/admin/${ctx.params.path.join('/')}${search}`

  const upstream = await fetch(upstreamUrl, {
    headers: { 'x-admin-key': key, accept: 'text/event-stream' },
    signal: req.signal,
  })

  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '')
    return new Response(body || `Upstream ${upstream.status}`, {
      status: upstream.status,
    })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
