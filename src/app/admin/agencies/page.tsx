'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  Pencil,
  CheckCircle2,
  PauseCircle,
  XCircle,
  X,
  Link,
  Clock,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatCard } from '@/components/ui/StatCard'
import type { Agency } from '@/lib/types'

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', commission_rate: '5', phone: '', address: '', invite: false })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({ name: '', status: 'active', commission_rate: '5', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setError(null)
    be
      .get<{ items: Agency[] }>('/agency/admin/agencies')
      .then((d) => setAgencies(d.items || []))
      .catch((e) => setError((e as Error).message))
  }
  useEffect(() => { load() }, [])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setInviteLink(null)
    try {
      const result = await be.send<{ invite_token?: string }>('/agency/admin/agencies', 'POST', {
        name: form.name,
        email: form.email,
        password: form.invite ? undefined : form.password,
        commission_rate: Number(form.commission_rate) / 100,
        phone: form.phone || undefined,
        address: form.address || undefined,
        invite: form.invite || undefined,
      })
      if (result.invite_token) {
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        setInviteLink(`${base}/agency/accept-invite?token=${result.invite_token}`)
      } else {
        setShowCreate(false)
        setForm({ name: '', email: '', password: '', commission_rate: '5', phone: '', address: '', invite: false })
        load()
      }
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (a: Agency) => {
    setEditingId(a.id)
    setEditForm({
      name: a.name,
      status: a.status,
      commission_rate: String(Math.round(a.commission_rate * 100)),
      phone: a.phone || '',
      address: a.address || '',
    })
  }

  const onSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      await be.send(`/agency/admin/agencies/${encodeURIComponent(editingId)}`, 'PATCH', {
        name: editForm.name,
        status: editForm.status,
        commission_rate: Number(editForm.commission_rate) / 100,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
      })
      setEditingId(null)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (error) return <PageError message={error} />
  if (!agencies) return <PageLoading />

  const activeCount = agencies.filter((a) => a.status === 'active').length
  const totalListings = agencies.reduce((s, a) => s + a.listings_count, 0)
  const totalClosings = agencies.reduce((s, a) => s + a.closings_count, 0)

  const filtered = agencies.filter((a) => {
    if (!search) return true
    const s = search.toLowerCase()
    return a.name.toLowerCase().includes(s) || a.email.toLowerCase().includes(s)
  })

  const statusStyle = (s: string) => {
    switch (s) {
      case 'active': return 'bg-verified-light text-verified'
      case 'paused': return 'bg-warning-light text-warning'
      case 'suspended': return 'bg-danger-light text-danger'
      case 'invited': return 'bg-action-light text-action'
      default: return 'bg-beige text-subtle'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h3 text-navy">Partner Agencies</h1>
          <p className="text-body-sm text-subtle mt-1">{agencies.length} agencies onboarded</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} strokeWidth={2} /> Onboard agency
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} iconColor="#2563eb" iconBgColor="#dbeafe" value={String(agencies.length)} label="Total agencies" />
        <StatCard icon={CheckCircle2} iconColor="#16a34a" iconBgColor="#dcfce7" value={String(activeCount)} label="Active" />
        <StatCard icon={Building2} iconColor="#9333ea" iconBgColor="#f3e8ff" value={String(totalListings)} label="Total listings" />
        <StatCard icon={Building2} iconColor="#ea580c" iconBgColor="#fff7ed" value={String(totalClosings)} label="Total closings" />
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-h4 text-navy">Onboard new agency</h2>
              <button onClick={() => setShowCreate(false)} className="text-subtle hover:text-navy">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={onCreate} className="space-y-4">
              <Input label="Agency name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <div className="flex items-center gap-3">
                <input
                  id="invite-toggle"
                  type="checkbox"
                  checked={form.invite}
                  onChange={(e) => setForm({ ...form, invite: e.target.checked })}
                  className="w-4 h-4 rounded border-divider text-action focus:ring-action"
                />
                <label htmlFor="invite-toggle" className="text-body-sm text-navy font-medium">
                  Send invite link (agency sets own password)
                </label>
              </div>
              {!form.invite && (
                <Input label="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Min 8 characters" />
              )}
              <Input label="Commission rate (%)" type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} min="0" max="100" step="0.5" />
              <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              {inviteLink && (
                <div className="bg-verified-light/50 border border-verified/20 rounded-input p-4 space-y-2">
                  <p className="text-body-sm font-semibold text-verified flex items-center gap-2">
                    <Link size={14} /> Invite link created
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-2 rounded-input border border-divider bg-white text-caption font-mono text-navy"
                      onFocus={(e) => e.target.select()}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => { navigator.clipboard.writeText(inviteLink) }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-caption text-subtle flex items-center gap-1">
                    <Clock size={12} /> Link expires in 7 days. Share with the agency to complete onboarding.
                  </p>
                </div>
              )}
              {createError && <p className="text-caption text-danger">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={creating}>
                  {form.invite ? 'Create & send invite' : 'Create agency'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setInviteLink(null) }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" strokeWidth={1.8} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agencies..."
          className="w-full pl-8 pr-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
        />
      </div>

      {/* Table */}
      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            {search ? 'No agencies match your search.' : 'No agencies onboarded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Agency</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Commission</th>
                  <th className="px-6 py-3">Listings</th>
                  <th className="px-6 py-3">Closings</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-beige/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-card bg-action-light text-action flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} strokeWidth={1.8} />
                        </div>
                        <div>
                          <p className="font-semibold text-navy text-body-sm">{a.name}</p>
                          <p className="text-caption text-subtle">{String(a.id ?? '').substring(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-caption text-subtle flex items-center gap-1"><Mail size={11} /> {a.email}</p>
                      {a.phone && <p className="text-caption text-subtle flex items-center gap-1 mt-0.5"><Phone size={11} /> {a.phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-body-sm font-semibold text-navy">{Math.round(a.commission_rate * 100)}%</td>
                    <td className="px-6 py-4 text-body-sm text-navy">{a.listings_count}</td>
                    <td className="px-6 py-4 text-body-sm text-navy">{a.closings_count}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-caption font-semibold ${statusStyle(a.status)}`}>
                        {a.status === 'active' ? <CheckCircle2 size={14} /> : a.status === 'paused' ? <PauseCircle size={14} /> : a.status === 'invited' ? <Clock size={14} /> : <XCircle size={14} />}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">{formatDateTime(a.created_at)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => editingId === a.id ? setEditingId(null) : startEdit(a)} className="p-1.5 rounded hover:bg-beige text-subtle hover:text-navy" title="Edit agency">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit panel */}
      {editingId && (
        <section className="bg-white rounded-card border border-divider shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h4 text-navy">Edit agency</h2>
            <button onClick={() => setEditingId(null)} className="text-subtle hover:text-navy"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <div>
              <label className="block text-nav font-medium text-navy mb-2">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="suspended">Suspended</option>
                <option value="invited">Invited</option>
              </select>
            </div>
            <Input label="Commission rate (%)" type="number" value={editForm.commission_rate} onChange={(e) => setEditForm({ ...editForm, commission_rate: e.target.value })} min="0" max="100" step="0.5" />
            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="sm:col-span-2" />
          </div>
          <div className="flex gap-3 mt-5">
            <Button onClick={onSaveEdit} isLoading={saving}>Save changes</Button>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </section>
      )}
    </div>
  )
}
