import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Two independent gates:
 *   /admin/*   → admin cookie session (single ADMIN_DASHBOARD_KEY)
 *   /dashboard → NextAuth JWT (real users from propabridge-backend)
 *
 * Public:  /, /login, /signup, /forgot-password, /admin/login, public APIs.
 */

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin gate ──────────────────────────────────────────
  const isAdminLogin =
    pathname === '/admin/login' || pathname.startsWith('/api/admin-auth/login')
  const isProtectedAdmin =
    (pathname.startsWith('/admin') && !isAdminLogin) || pathname.startsWith('/api/admin/')

  if (isProtectedAdmin) {
    const isAdminAuthed = req.cookies.get('propa_admin_session')?.value === 'ok'
    if (!isAdminAuthed) {
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
    const isAdminAuthed = req.cookies.get('propa_admin_session')?.value === 'ok'
    if (isAdminAuthed) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Customer dashboard gate ─────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })
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
    '/dashboard/:path*',
  ],
}
