'use client'

/**
 * Customer-facing client API. Calls propabridge-backend api-gateway directly
 * (CORS-allowed). The user's NextAuth session JWT is forwarded so the backend
 * can identify the user.
 *
 * NOTE: today we just attach `Authorization: Bearer <id>` if the session
 * exposes one. Adapt this to the auth scheme your backend expects.
 */

import { getSession } from 'next-auth/react'

const BASE = process.env.NEXT_PUBLIC_PROPA_BACKEND_BASE || ''

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

async function authHeaders(): Promise<HeadersInit> {
  const session = await getSession()
  const headers: Record<string, string> = {}
  if (session?.user?.id) headers['x-user-id'] = String(session.user.id)
  return headers
}

export const customer = {
  async get<T>(path: string): Promise<T> {
    if (!BASE) throw new Error('NEXT_PUBLIC_PROPA_BACKEND_BASE not configured')
    const headers = await authHeaders()
    return fetch(`${BASE}${path}`, { headers, credentials: 'omit' }).then(unwrap<T>)
  },
  async send<T>(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown,
  ): Promise<T> {
    if (!BASE) throw new Error('NEXT_PUBLIC_PROPA_BACKEND_BASE not configured')
    const headers = {
      ...(await authHeaders()),
      ...(body ? { 'content-type': 'application/json' } : {}),
    }
    return fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'omit',
      body: body ? JSON.stringify(body) : undefined,
    }).then(unwrap<T>)
  },
}
