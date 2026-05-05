'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function AgencyLoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/agency-auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.replace(search.get('next') || '/agency')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-badge bg-gold-light text-[#5d3e02] text-caption font-semibold uppercase tracking-wide mb-6">
        <Building2 size={14} strokeWidth={2} />
        Agency Portal
      </div>
      <h2 className="text-h2 text-navy">Sign in to your agency</h2>
      <p className="text-body text-subtle mt-2">
        Manage your portfolio, leads, viewings, and commissions on Propabridge.
      </p>

      <form onSubmit={onSubmit} className="space-y-5 mt-8">
        <Input
          label="Agency email"
          type="email"
          placeholder="partnerships@your-agency.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={error ?? undefined}
        />
        <Button type="submit" variant="primary" isLoading={loading} className="w-full">
          SIGN IN <ChevronRight size={14} />
        </Button>
      </form>

      <p className="mt-8 text-center text-caption text-subtle">
        Not a partner agency yet? Email{' '}
        <a
          href="mailto:partnerships@propabridge.com"
          className="text-action font-semibold"
        >
          partnerships@propabridge.com
        </a>
        .
      </p>
    </div>
  )
}
