import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { beFetch, ApiError } from '@/lib/api'

/**
 * Proxy: /api/admin/be/* → propabridge-backend api-gateway /*
 *
 * Path is forwarded as-is, e.g.
 *   GET /api/admin/be/listings?limit=20    →  GET <backend>/listings?limit=20
 *   GET /api/admin/be/leads                →  GET <backend>/leads
 *   POST /api/admin/be/scheduler/book      →  POST <backend>/scheduler/book
 */

async function handle(
  req: Request,
  ctx: { params: { path: string[] } },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { search } = new URL(req.url)
  const target = `/${ctx.params.path.join('/')}${search}`

  const init: RequestInit = { method }
  if (method !== 'GET' && method !== 'DELETE') {
    const body = await req.text()
    if (body) init.body = body
  }

  try {
    const data = await beFetch(target, init)
    return NextResponse.json(data)
  } catch (e) {
    const err = e as ApiError
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
