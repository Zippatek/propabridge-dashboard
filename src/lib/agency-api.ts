'use client'

/**
 * Agency client API — calls our /api/agency proxy (cookie-protected).
 */

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const agency = {
  get: <T,>(path: string) =>
    fetch(`/api/agency${path}`, { credentials: 'same-origin' }).then(unwrap<T>),
  send: <T,>(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown,
  ) =>
    fetch(`/api/agency${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(unwrap<T>),
}
