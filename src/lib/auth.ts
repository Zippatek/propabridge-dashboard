import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

/**
 * PROPABRIDGE AUTH CONFIGURATION
 * NextAuth.js v5 — FOUNDATION.md Section 10
 *
 * Providers:
 * - Google OAuth (requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars)
 * - Credentials (email + password)
 *
 * For development, credentials auth uses mock validation.
 * Replace with real API/database validation in production.
 */

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
        // Development mock — replace with real auth in production
        if (
          credentials?.email === 'aminu@example.com' &&
          credentials?.password === 'password123'
        ) {
          return {
            id: 'user-001',
            name: 'Aminu Ibrahim',
            email: 'aminu@example.com',
            image: '/images/avatar-default.jpg',
          }
        }
        return null
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
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
