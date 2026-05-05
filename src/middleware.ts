import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Three independent gates:
 *   /admin/*    → ADMIN cookie session (single ADMIN_DASHBOARD_KEY)
 *   /agency/*   → AGENCY cookie session (token from /agency/auth/login)
 *   /dashboard/*→ NextAuth JWT (real customer accounts)
 */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin zone ──────────────────────────────────────────
  const isAdminLogin =
    pathname === '/admin/login' || pathname.startsWith('/api/admin-auth/login')
  if (
    (pathname.startsWith('/admin') && !isAdminLogin) ||
    pathname.startsWith('/api/admin/')
  ) {
    const ok = req.cookies.get('propa_admin_session')?.value === 'ok'
    if (!ok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
  if (pathname === '/admin/login') {
    if (req.cookies.get('propa_admin_session')?.value === 'ok') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Agency zone ─────────────────────────────────────────
  const isAgencyLogin =
    pathname === '/agency/login' || pathname.startsWith('/api/agency-auth/login')
  if (
    (pathname.startsWith('/agency') && !isAgencyLogin) ||
    pathname.startsWith('/api/agency/')
  ) {
    const tok = req.cookies.get('propa_agency_session')?.value
    if (!tok) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const url = req.nextUrl.clone()
      url.pathname = '/agency/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
  if (pathname === '/agency/login') {
    if (req.cookies.get('propa_agency_session')?.value) {
      const url = req.nextUrl.clone()
      url.pathname = '/agency'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Customer zone ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/admin-auth/:path*',
    '/agency/:path*',
    '/api/agency/:path*',
    '/api/agency-auth/:path*',
    '/dashboard/:path*',
  ],
}
