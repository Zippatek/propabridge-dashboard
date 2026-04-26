'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { be } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface KycUser {
  id: string
  name?: string
  email?: string
  phone?: string
  status?: string
  document_type?: string
  submitted_at?: string
  [key: string]: unknown
}
type KycResp = { items?: KycUser[]; data?: KycUser[] } | KycUser[]

export default function AdminUsersPage() {
  const [items, setItems] = useState<KycUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setItems(null)
    setError(null)
    try {
      const v = await be.get<KycResp>('/admin/kyc/pending')
      const list = Array.isArray(v)
        ? v
        : (v as { users?: KycUser[]; items?: KycUser[]; data?: KycUser[] }).users ||
          (v as { items?: KycUser[] }).items ||
          (v as { data?: KycUser[] }).data ||
          []
      setItems(list)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    load()
  }, [])

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

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between bg-gold-light/40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-gold" strokeWidth={1.8} />
            <h2 className="text-h4 text-navy">KYC Review Queue</h2>
          </div>
          <span className="text-caption text-subtle">
            {items === null ? '—' : `${items.length} pending`}
          </span>
        </div>

        {items === null ? (
          <PageLoading />
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No pending KYC reviews.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Document</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-beige/30">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">{u.name || 'Unnamed'}</p>
                      <p className="text-caption text-subtle">
                        {u.email || u.phone || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-body-sm">
                      {u.document_type || '—'}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatDateTime(u.submitted_at)}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-6 text-body-sm text-subtle flex gap-3 items-start">
        <AlertTriangle size={18} className="text-gold mt-0.5 flex-shrink-0" strokeWidth={1.8} />
        <div>
          <p className="font-semibold text-navy">Listing all users</p>
          <p className="mt-1">
            The propabridge-backend api-gateway does not currently expose a
            <code className="bg-beige px-1.5 py-0.5 rounded mx-1 text-navy font-mono text-caption">
              GET /admin/users
            </code>
            endpoint. To list / search every registered user, add that route to
            <code className="bg-beige px-1.5 py-0.5 rounded mx-1 text-navy font-mono text-caption">
              api-gateway/src/routes/admin.js
            </code>
            and this page will pick it up automatically.
          </p>
        </div>
      </section>
    </div>
  )
}
