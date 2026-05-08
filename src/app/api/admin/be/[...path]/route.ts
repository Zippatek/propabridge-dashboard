import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { beFetch, ApiError } from '@/lib/api'
import { normalizeListingType } from '@/lib/listing-type'

/**
 * Proxy: /api/admin/be/* → propabridge-backend api-gateway /*
 *
 * Path is forwarded as-is, e.g.
 *   GET /api/admin/be/listings?limit=20    →  GET <backend>/listings?limit=20
 *   GET /api/admin/be/leads                →  GET <backend>/leads
 *   POST /api/admin/be/scheduler/book      →  POST <backend>/scheduler/book
 */

/**
 * Coalesce `listing_type` + `transaction_type` and normalize before forwarding.
 * Emit only `sale` | `rent` so older DB constraints never reject PATCH bodies.
 */
function normalizeForwardedListingBody(bodyText: string, pathJoined: string): string {
  const root = pathJoined.split('/')[0]
  if (root !== 'listings') return bodyText
  try {
    const obj = JSON.parse(bodyText) as Record<string, unknown>
    if (!('listing_type' in obj) && !('transaction_type' in obj)) return bodyText

    const coalesced = obj.listing_type ?? obj.transaction_type
    obj.listing_type = normalizeListingType(
      coalesced !== undefined && coalesced !== null ? String(coalesced) : undefined,
    )
    delete obj.transaction_type
    return JSON.stringify(obj)
  } catch {
    return bodyText
  }
}

/** Older dashboards called `/api/admin/be/admin/properties/…` — strip duplicate `admin`. */
function rewriteBackendSegments(segments: string[]): string[] {
  if (segments.length >= 2 && segments[0] === 'admin' && segments[1] === 'properties') {
    return segments.slice(1)
  }
  return segments
}

async function handle(
  req: Request,
  ctx: { params: { path: string[] } },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { search } = new URL(req.url)
  const segments = rewriteBackendSegments(ctx.params.path)
  const pathJoined = segments.join('/')
  const target = `/${pathJoined}${search}`

  const init: RequestInit = { method }
  if (method !== 'GET' && method !== 'DELETE') {
    const body = await req.text()
    if (body) {
      init.body =
        method === 'POST' || method === 'PATCH' || method === 'PUT'
          ? normalizeForwardedListingBody(body, pathJoined)
          : body
    }
  }

  try {
    const data = await beFetch(target, init)
    return NextResponse.json(data)
  } catch (e) {
    const err = e as ApiError
    // When the backend returns an HTML page (Express default for unimplemented routes),
    // serve an empty collection rather than leaking raw HTML to the client.
    if (method === 'GET' && err.status === 404) {
      const msg = err.message ?? ''
      if (msg.includes('Cannot GET') || msg.trimStart().startsWith('<')) {
        return NextResponse.json({ items: [], data: [], neighborhoods: [], total: 0 })
      }
    }
    // Best-effort embedding refresh after AI rewrite — older api-gateway revisions 404 here.
    // Same-origin XHR still shows as "CORS/type" noise in devtools when status is 4xx; return 200.
    if (
      method === 'POST' &&
      err.status === 404 &&
      /^properties\/[^/]+\/embed$/.test(pathJoined)
    ) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Upstream embedding route unavailable; listing save is unaffected.',
      })
    }
    return NextResponse.json(
      { error: err.message || 'Upstream error' },
      { status: err.status || 500 },
    )
  }
}

type Ctx = { params: { path: string[] } }
export const GET = (req: Request, ctx: Ctx) => handle(req, ctx, 'GET')
export const POST = (req: Request, ctx: Ctx) => handle(req, ctx, 'POST')
export const PUT = (req: Request, ctx: Ctx) => handle(req, ctx, 'PUT')
export const DELETE = (req: Request, ctx: Ctx) => handle(req, ctx, 'DELETE')
export const PATCH = (req: Request, ctx: Ctx) => handle(req, ctx, 'PATCH')
