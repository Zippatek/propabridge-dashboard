import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

/**
 * PROPABRIDGE AUTH CONFIGURATION
 * NextAuth.js v5 — real user auth via propabridge-backend API gateway
 *
 * Providers:
 * - Google OAuth
 * - Credentials → POST /auth/login on the live backend (property-db-instance)
 *
 * Registration is handled client-side via POST /auth/register on the backend.
 */

const BACKEND_BASE =
  process.env.PROPA_BACKEND_BASE || 'https://propabridge-api-gateway-480235407496.us-central1.run.app'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo user overrides for local testing
        if (credentials.email === 'demo@propabridge.com' && credentials.password === 'demo12345678') {
          return {
            id: 'demo-buyer-123',
            name: 'Demo Buyer',
            email: 'demo@propabridge.com',
            image: null,
            role: 'buyer',
            kyc_status: 'approved',
          }
        }

        if (credentials.email === 'agency@propabridge.com' && credentials.password === 'demo12345678') {
          return {
            id: 'demo-agency-123',
            name: 'Demo Agency',
            email: 'agency@propabridge.com',
            image: null,
            role: 'agency',
            kyc_status: 'approved',
          }
        }

        if (credentials.email === 'admin@propabridge.com' && credentials.password === 'demo123') {
          return {
            id: 'demo-admin-123',
            name: 'Demo Admin',
            email: 'admin@propabridge.com',
            image: null,
            role: 'admin',
            kyc_status: 'approved',
          }
        }

        try {
          const res = await fetch(`${BACKEND_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            // Short timeout — if backend is unreachable, fail fast
            signal: AbortSignal.timeout(10_000),
          })

          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            // Return null to trigger "CredentialsSignin" error in NextAuth
            console.warn('[Auth] Login rejected:', body?.error)
            return null
          }

          const { user } = await res.json()
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
            // Custom fields forwarded through JWT
            role: user.role,
            kyc_status: user.kyc_status,
          }
        } catch (err) {
          console.error('[Auth] Backend unreachable:', (err as Error).message)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'buyer'
        token.kyc_status = (user as { kyc_status?: string }).kyc_status ?? 'pending'
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
          ; (session.user as { role?: string; kyc_status?: string }).role = token.role as string
          ; (session.user as { kyc_status?: string }).kyc_status = token.kyc_status as string
      }
      return session
    },
  },
}
