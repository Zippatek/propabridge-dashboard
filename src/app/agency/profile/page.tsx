'use client'

import { useEffect, useState } from 'react'
import { Building2, Mail, Phone, MapPin, Save } from 'lucide-react'
import { agency } from '@/lib/agency-api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Profile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  commission_rate: number
  payout_account_name?: string
  payout_account_number?: string
  payout_bank?: string
  created_at?: string
}

export default function AgencyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    agency
      .get<Profile>('/profile')
      .then(setProfile)
      .catch((e) => setError((e as Error).message))
  }, [])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSaved(false)
    // Only send fields the backend allows editing (name, phone, address,
    // logo_url, payout_account_name/number/bank). Commission rate and
    // email are admin-only / identity fields — silently dropped by backend.
    const { name, phone, address, payout_account_name, payout_account_number, payout_bank } = profile
    try {
      await agency.send<Profile>('/profile', 'PATCH', {
        name, phone, address,
        payout_account_name, payout_account_number, payout_bank,
      })
      setSaved(true)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p))

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/profile not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (!profile) return <PageLoading />

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-3xl">
      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={18} className="text-action" strokeWidth={1.8} />
          <h2 className="text-h4 text-navy">Agency details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Agency name"
            value={profile.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={profile.email}
            readOnly
            helperText="Contact support to change email"
          />
          <Input
            label="Phone"
            value={profile.phone || ''}
            onChange={(e) => set('phone', e.target.value)}
          />
          <Input
            label="Office address"
            value={profile.address || ''}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <h2 className="text-h4 text-navy mb-1">Partnership terms</h2>
        <p className="text-caption text-subtle mb-5">
          Set by Propabridge partnerships team. Contact support to negotiate changes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Commission rate (%)"
            type="text"
            value={`${Math.round(profile.commission_rate * 100)}%`}
            readOnly
          />
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-6">
        <h2 className="text-h4 text-navy mb-5">Payout account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Account name"
            value={profile.payout_account_name || ''}
            onChange={(e) => set('payout_account_name', e.target.value)}
          />
          <Input
            label="Bank"
            value={profile.payout_bank || ''}
            onChange={(e) => set('payout_bank', e.target.value)}
          />
          <Input
            label="Account number"
            value={profile.payout_account_number || ''}
            onChange={(e) => set('payout_account_number', e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" isLoading={saving}>
          <Save size={14} strokeWidth={2} />
          Save changes
        </Button>
        {saved && <span className="text-caption text-verified">Saved.</span>}
      </div>
    </form>
  )
}
