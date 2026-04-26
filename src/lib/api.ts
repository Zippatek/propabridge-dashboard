import 'server-only'

/**
 * Server-only fetchers for the two Propabridge backends.
 *
 *   adkFetch  → propabridge-adk  (FastAPI, x-admin-key header)
 *   beFetch   → propabridge-backend api-gateway (Node/Express)
 *
 * Both are called from the admin proxy routes under /api/admin/*. Secrets
 * stay on the server — the browser only sees this app's own cookies.
 */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const ADK_BASE = process.env.PROPA_ADK_BASE || ''
const BE_BASE = process.env.PROPA_BACKEND_BASE || ''

async function rawFetch<T>(
  base: string,
  path: string,
  init: RequestInit,
  authHeaders: Record<string, string>,
  serviceLabel: string,
): Promise<T> {
  if (!base) throw new ApiError(500, `${serviceLabel} base URL not configured`)

  const headers = new Headers(init.headers)
  for (const [k, v] of Object.entries(authHeaders)) headers.set(k, v)
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const res = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' })
  const text = await res.text()
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    /* keep as text */
  }

  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'detail' in (body as object)
        ? String((body as { detail: unknown }).detail)
        : body && typeof body === 'object' && 'error' in (body as object)
          ? String((body as { error: unknown }).error)
          : typeof body === 'string'
            ? body
            : `${serviceLabel} ${res.status}`
    throw new ApiError(res.status, msg)
  }

  return body as T
}

export function adkFetch<T = unknown>(path: string, init: RequestInit = {}) {
  const key = process.env.PROPA_ADK_ADMIN_KEY
  if (!key) throw new ApiError(500, 'PROPA_ADK_ADMIN_KEY not configured')
  return rawFetch<T>(ADK_BASE, path, init, { 'x-admin-key': key }, 'propabridge-adk')
}

export function beFetch<T = unknown>(path: string, init: RequestInit = {}) {
  // The backend api-gateway/src/routes/admin.js checks the 'x-admin-token' header.
  // PROPA_BACKEND_ADMIN_TOKEN is set in .env.local to the value the backend expects.
  const token = process.env.PROPA_BACKEND_ADMIN_TOKEN
  const auth: Record<string, string> = token ? { 'x-admin-token': token } : {}
  return rawFetch<T>(BE_BASE, path, init, auth, 'propabridge-backend')
}

export async function verifyAdminPassword(key: string): Promise<boolean> {
  const expected = process.env.ADMIN_DASHBOARD_KEY
  return Boolean(expected) && key === expected
}
