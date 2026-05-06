'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Search, Users } from 'lucide-react'
import { be } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import { StatCard } from '@/components/ui/StatCard'

interface User {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  phone?: string
  role?: string
  kyc_status?: 'pending' | 'verified' | 'rejected' | null
  document_type?: string
  submitted_at?: string
  created_at?: string
}

type AnyResp =
  | User[]
  | { items?: User[]; users?: User[]; data?: User[]; count?: number }

type Tab = 'all' | 'pending' | 'verified' | 'rejected'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All users' },
  { value: 'pending', label: 'KYC pending' },
  { value: 'verified', label: 'KYC verified' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [pending, setPending] = useState<User[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const load = async () => {
    setUsers(null)
    setPending(null)
    setError(null)
    try {
      // Two endpoints:
      //   /admin/users         — full list (now exposed)
      //   /admin/kyc/pending   — sub-view used for the KYC reviewer table
      // We fetch both so the tabs can switch instantly.
      const [allResp, pendResp] = await Promise.all([
        be.get<AnyResp>('/admin/users?limit=500'),
        be.get<AnyResp>('/admin/kyc/pending'),
      ])
      const unwrap = (v: AnyResp): User[] =>
        Array.isArray(v)
          ? v
          : v.users || v.items || v.data || []
      setUsers(unwrap(allResp))
      setPending(unwrap(pendResp))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => { load() }, [])

  const review = async (userId: string, decision: 'approved' | 'rejected') => {
    const reason =
      decision === 'rejected' ? prompt('Reason for rejection (optional):') || '' : ''
    try {
      await be.send(`/admin/users/${encodeURIComponent(userId)}/kyc/review`, 'POST', {
        decision,
        reason,
      })
      load()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const display = useMemo(() => {
    if (!users) return null
    let list: User[]
    if (tab === 'pending') list = pending || []
    else if (tab === 'verified') list = users.filter((u) => u.kyc_status === 'verified')
    else if (tab === 'rejected') list = users.filter((u) => u.kyc_status === 'rejected')
    else list = users
    if (!search.trim()) return list
    const s = search.trim().toLowerCase()
    return list.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(s) ||
        (u.phone || '').toLowerCase().includes(s) ||
        ((u.first_name || '') + ' ' + (u.last_name || '') + ' ' + (u.name || ''))
          .toLowerCase()
          .includes(s),
    )
  }, [users, pending, tab, search])

  if (error) return <PageError message={error} />
  if (!users || display === null) return <PageLoading />

  const totals = {
    all: users.length,
    pending: (pending || []).length,
    verified: users.filter((u) => u.kyc_status === 'verified').length,
    rejected: users.filter((u) => u.kyc_status === 'rejected').length,
  }

  const fullName = (u: User) =>
    u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unnamed'

  const kycBadge = (s: User['kyc_status']) => {
    switch (s) {
      case 'verified': return 'bg-verified-light text-verified'
      case 'pending': return 'bg-warning-light text-warning'
      case 'rejected': return 'bg-danger-light text-danger'
      default: return 'bg-beige text-subtle'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h3 text-navy">Users</h1>
        <p className="text-body-sm text-subtle mt-1">
          Customer accounts and KYC review.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} iconColor="#2563eb" iconBgColor="#dbeafe" value={String(totals.all)} label="Total users" />
        <StatCard icon={ShieldCheck} iconColor="#f59e0b" iconBgColor="#fffbeb" value={String(totals.pending)} label="KYC pending" />
        <StatCard icon={ShieldCheck} iconColor="#16a34a" iconBgColor="#dcfce7" value={String(totals.verified)} label="KYC verified" />
        <StatCard icon={ShieldCheck} iconColor="#dc2626" iconBgColor="#fef2f2" value={String(totals.rejected)} label="Rejected" />
      </div>

      <div className="flex gap-1 border-b border-divider overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2.5 text-body-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.value
                ? 'border-action text-navy'
                : 'border-transparent text-subtle hover:text-navy'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-caption text-subtle">({totals[t.value]})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" strokeWidth={1.8} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-8 pr-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
        />
      </div>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {display.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            {search ? 'No users match your search.' : 'No users in this view.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">KYC</th>
                  <th className="px-6 py-3">Joined</th>
                  {tab === 'pending' && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {display.map((u) => (
                  <tr key={u.id} className="hover:bg-beige/30">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{fullName(u)}</p>
                      <p className="text-caption text-subtle">{u.email || u.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy capitalize">{u.role || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold ${kycBadge(u.kyc_status)}`}>
                        {u.kyc_status || 'none'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatDateTime(u.created_at || u.submitted_at)}
                    </td>
                    {tab === 'pending' && (
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => review(u.id, 'approved')}
                            className="text-body-sm font-semibold text-verified bg-verified-light px-3 py-1.5 rounded-button"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => review(u.id, 'rejected')}
                            className="text-body-sm font-semibold text-danger bg-danger-light px-3 py-1.5 rounded-button"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
