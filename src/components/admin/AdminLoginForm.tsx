'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function AdminLoginForm() {
  const router = useRouter()
  const search = useSearchParams()
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.replace(search.get('next') || '/admin')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-badge bg-action-light text-action text-caption font-semibold uppercase tracking-wide mb-6">
        <ShieldCheck size={14} strokeWidth={2} />
        Admin Access
      </div>
      <h2 className="text-h2 text-navy">Sign in to Propabridge Admin</h2>
      <p className="text-body text-subtle mt-2">
        Enter your admin dashboard key to continue.
      </p>

      <form onSubmit={onSubmit} className="space-y-5 mt-8">
        <Input
          label="Admin key"
          type="password"
          placeholder="Enter ADMIN_DASHBOARD_KEY"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
          autoComplete="current-password"
          error={error ?? undefined}
        />
        <Button type="submit" variant="primary" isLoading={loading} className="w-full">
          SIGN IN <ChevronRight size={14} />
        </Button>
      </form>

      <p className="mt-8 text-center text-caption text-subtle">
        Customer login is at <a href="/login" className="text-action font-semibold">/login</a>.
      </p>
    </div>
  )
}
