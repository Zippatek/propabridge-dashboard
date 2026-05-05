'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AgencyAcceptInvitePage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('No invite token found. Please use the link from your invitation email.')
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/agency/accept-invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to accept invite')
        return
      }
      // Store the session token
      if (data.token) {
        document.cookie = `agency_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
      }
      setSuccess(true)
      setTimeout(() => router.push('/agency'), 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige/30 p-4">
        <div className="bg-white rounded-card border border-divider shadow-card p-8 max-w-md w-full text-center">
          <CheckCircle2 size={48} className="text-verified mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-h3 text-navy mb-2">Account activated!</h1>
          <p className="text-body-sm text-subtle">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-beige/30 p-4">
      <div className="bg-white rounded-card border border-divider shadow-card p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-card bg-action-light text-action flex items-center justify-center">
            <Building2 size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-h4 text-navy">Accept your invitation</h1>
            <p className="text-caption text-subtle">Set your password to activate your agency account</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-input bg-danger-light/50 border border-danger/20">
            <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min 8 characters"
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" isLoading={submitting} className="w-full">
            Activate account
          </Button>
        </form>
      </div>
    </div>
  )
}
