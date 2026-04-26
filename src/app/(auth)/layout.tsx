import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Propabridge — Sign In',
  description: 'Sign in to your Propabridge account to find verified homes across Nigeria.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
