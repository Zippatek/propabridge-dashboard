import 'server-only'
import NextAuth from 'next-auth'
import { authConfig } from './auth'

const { auth, signIn, signOut } = NextAuth(authConfig)

export { auth, signIn, signOut }
