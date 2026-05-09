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
  /** Same-origin proxy; preserves HTTP status (unlike unwrap) for nuanced client handling */
  fetchJson: async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/admin/adk${path}`, {
      credentials: 'same-origin',
      ...init,
    })
    const text = await res.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    return { ok: res.ok, status: res.status, data }
  },
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
