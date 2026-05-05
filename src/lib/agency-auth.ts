import 'server-only'
import { cookies } from 'next/headers'

/**
 * Agency session — opaque token from propabridge-backend's /agency/auth/login.
 * Stored in an httpOnly cookie. The token is forwarded as `x-agency-token` to
 * agency-scoped backend endpoints.
 */

export const AGENCY_COOKIE = 'propa_agency_session'
const TWO_WEEKS = 60 * 60 * 24 * 14

export function getAgencyToken(): string | null {
  return cookies().get(AGENCY_COOKIE)?.value || null
}

export function setAgencySession(token: string) {
  cookies().set(AGENCY_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TWO_WEEKS,
  })
}

export function clearAgencySession() {
  cookies().delete(AGENCY_COOKIE)
}

export function isAgencyAuthed(): boolean {
  return Boolean(cookies().get(AGENCY_COOKIE)?.value)
}
