import 'server-only'
import { cookies } from 'next/headers'

/**
 * Admin-only session cookie. Independent from the customer NextAuth session,
 * so an admin signing in does not affect end-users and vice versa.
 */

export const ADMIN_COOKIE = 'propa_admin_session'
const ONE_WEEK = 60 * 60 * 24 * 7

export function isAdminAuthed(): boolean {
  return cookies().get(ADMIN_COOKIE)?.value === 'ok'
}

export function setAdminSession() {
  cookies().set(ADMIN_COOKIE, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK,
  })
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE)
}
