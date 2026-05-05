import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Three independent gates:
 *   /admin/*    → ADMIN cookie session (single ADMIN_DASHBOARD_KEY)
 *   /agency/*   → AGENCY cookie session (token from /agency/auth/login)
 *   /dashboard/*→ NextAuth JWT (real customer accounts)
 *
 * Security headers are applied to ALL responses.
 */

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://propabridge-api-gateway-480235407496.us-central1.run.app; frame-ancestors 'none';",
  )
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )
  return res
}

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
        return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname)
      return withSecurityHeaders(NextResponse.redirect(url))
    }
    return withSecurityHeaders(NextResponse.next())
  }
  if (pathname === '/admin/login') {
    if (req.cookies.get('propa_admin_session')?.value === 'ok') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return withSecurityHeaders(NextResponse.redirect(url))
    }
    return withSecurityHeaders(NextResponse.next())
  }

  // ── Agency zone ─────────────────────────────────────────
  const isAgencyLogin =
    pathname === '/agency/login' || pathname.startsWith('/api/agency-auth/login')
  const isAgencyInvite =
    pathname === '/agency/accept-invite' || pathname === '/api/agency/accept-invite'
  if (
    (pathname.startsWith('/agency') && !isAgencyLogin && !isAgencyInvite) ||
    (pathname.startsWith('/api/agency/') && !isAgencyInvite)
  ) {
    const tok = req.cookies.get('propa_agency_session')?.value
    if (!tok) {
      if (pathname.startsWith('/api/')) {
        return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }
      const url = req.nextUrl.clone()
      url.pathname = '/agency/login'
      url.searchParams.set('next', pathname)
      return withSecurityHeaders(NextResponse.redirect(url))
    }
    return withSecurityHeaders(NextResponse.next())
  }
  if (pathname === '/agency/login') {
    if (req.cookies.get('propa_agency_session')?.value) {
      const url = req.nextUrl.clone()
      url.pathname = '/agency'
      url.search = ''
      return withSecurityHeaders(NextResponse.redirect(url))
    }
    return withSecurityHeaders(NextResponse.next())
  }

  // ── Customer zone ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return withSecurityHeaders(NextResponse.redirect(url))
    }
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/admin-auth/:path*',
    '/agency/:path*',
    '/api/agency/:path*',
    '/api/agency-auth/:path*',
    '/api/agency/accept-invite',
    '/dashboard/:path*',
    '/(.*)',
  ],
}
