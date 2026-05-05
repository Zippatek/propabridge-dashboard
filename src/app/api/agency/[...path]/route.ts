import { NextResponse } from 'next/server'
import { getAgencyToken } from '@/lib/agency-auth'
import * as mock from '@/lib/agency-mock-data'

/**
 * Proxy: /api/agency/* → propabridge-backend /agency/*
 * Forwards the agency token as x-agency-token (server-only).
 * Fallbacks to mock data if the backend is not wired or unreachable.
 */

const BASE = process.env.PROPA_BACKEND_BASE || ''

async function handle(
  req: Request,
  ctx: { params: { path: string[] } },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
) {
  const token = getAgencyToken()
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const path = ctx.params.path.join('/')
  const isDev = token.startsWith('dev:')

  // Helper to get mock data based on path
  const getMockData = () => {
    if (path === 'overview') return mock.MOCK_OVERVIEW
    if (path === 'listings') return mock.MOCK_LISTINGS
    if (path === 'leads') return mock.MOCK_LEADS
    if (path === 'inspections') return mock.MOCK_INSPECTIONS
    if (path === 'commissions') return mock.MOCK_COMMISSIONS
    if (path === 'profile') return mock.MOCK_PROFILE
    return null
  }

  // If we are in dev mode and don't have a configured backend host, 
  // or if the path is something we have mocks for, we can prioritize mocks.
  if (isDev || !BASE) {
    const data = getMockData()
    if (data) return NextResponse.json(data)
  }

  if (!BASE) {
    return NextResponse.json(
      { error: 'PROPA_BACKEND_BASE not configured' },
      { status: 500 },
    )
  }

  const { search } = new URL(req.url)
  const target = `${BASE}/agency/${path}${search}`

  const headers = new Headers({ 'x-agency-token': token })
  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'DELETE') {
    const text = await req.text()
    if (text) {
      body = text
      headers.set('content-type', req.headers.get('content-type') || 'application/json')
    }
  }

  try {
    const upstream = await fetch(target, { method, headers, body, cache: 'no-store' })
    const text = await upstream.text()
    let data: unknown = text
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      /* keep as text */
    }

    if (!upstream.ok) {
      // If backend fails but we have mock data, use it in dev mode
      const mockFallback = getMockData()
      if (mockFallback && (isDev || upstream.status === 404)) {
        return NextResponse.json(mockFallback)
      }

      return NextResponse.json(
        { error: typeof data === 'object' && data && 'error' in data
            ? (data as { error: string }).error
            : `Upstream ${upstream.status}` },
        { status: upstream.status },
      )
    }
    return NextResponse.json(data)
  } catch (e) {
    // If network fails completely, return mock data if available
    const mockFallback = getMockData()
    if (mockFallback) return NextResponse.json(mockFallback)

    return NextResponse.json(
      { error: (e as Error).message || 'Network error' },
      { status: 502 },
    )
  }
}

type Ctx = { params: { path: string[] } }
export const GET = (req: Request, ctx: Ctx) => handle(req, ctx, 'GET')
export const POST = (req: Request, ctx: Ctx) => handle(req, ctx, 'POST')
export const PUT = (req: Request, ctx: Ctx) => handle(req, ctx, 'PUT')
export const DELETE = (req: Request, ctx: Ctx) => handle(req, ctx, 'DELETE')
export const PATCH = (req: Request, ctx: Ctx) => handle(req, ctx, 'PATCH')
