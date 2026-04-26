'use client'

/**
 * Browser-side fetch helpers for the admin section.
 *
 *   adk(path)  → /api/admin/adk{path}   → propabridge-adk
 *   be(path)   → /api/admin/be{path}    → propabridge-backend
 */

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const adk = {
  get: <T,>(path: string) =>
    fetch(`/api/admin/adk${path}`, { credentials: 'same-origin' }).then(unwrap<T>),
  send: <T,>(path: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', body?: unknown) =>
    fetch(`/api/admin/adk${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(unwrap<T>),
}

export const be = {
  get: <T,>(path: string) =>
    fetch(`/api/admin/be${path}`, { credentials: 'same-origin' }).then(unwrap<T>),
  send: <T,>(path: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', body?: unknown) =>
    fetch(`/api/admin/be${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(unwrap<T>),
}
