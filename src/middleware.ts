import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Gate ONLY the admin section. Customer routes (/dashboard/*, /login, /signup,
 * /forgot-password) are managed by NextAuth and untouched here.
 */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminAuthed = req.cookies.get('propa_admin_session')?.value === 'ok'

  // Anything under /admin except /admin/login and /api/admin-auth/login is gated
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/api/admin-auth/login')
  const isProtectedAdmin =
    (pathname.startsWith('/admin') && !isAdminLogin) || pathname.startsWith('/api/admin/')

  if (isProtectedAdmin && !isAdminAuthed) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdminAuthed && pathname === '/admin/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/admin-auth/:path*'],
}
