'use client'

import { useEffect, useState } from 'react'
import { BadgeDollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { StatCard } from '@/components/ui'
import { agency } from '@/lib/agency-api'
import { formatNaira, formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface CommissionRow {
  id: string
  property_id?: string
  property_title?: string
  buyer_name?: string
  closing_date?: string
  sale_price_ngn: number
  commission_rate: number
  commission_ngn: number
  status: 'pending' | 'in_escrow' | 'paid'
  paid_at?: string
}

interface Summary {
  total_paid_ngn: number
  total_pending_ngn: number
  total_in_escrow_ngn: number
  closings_count: number
}

type Resp = { items?: CommissionRow[]; summary?: Summary }

export default function AgencyCommissionsPage() {
  const [data, setData] = useState<Resp | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    agency
      .get<Resp>('/commissions')
      .then(setData)
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/commissions not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (!data) return <PageLoading />

  const items = data.items || []
  const sum = data.summary || {
    total_paid_ngn: 0,
    total_pending_ngn: 0,
    total_in_escrow_ngn: 0,
    closings_count: 0,
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={CheckCircle2}
          iconColor="#1a7a4a"
          iconBgColor="rgba(26, 122, 74, 0.10)"
          value={formatNaira(sum.total_paid_ngn)}
          label="Paid YTD"
          delay={50}
        />
        <StatCard
          icon={Clock}
          iconColor="#d97706"
          iconBgColor="rgba(217, 119, 6, 0.10)"
          value={formatNaira(sum.total_in_escrow_ngn)}
          label="In escrow"
          delay={100}
        />
        <StatCard
          icon={BadgeDollarSign}
          iconColor="#006aff"
          iconBgColor="rgba(0, 106, 255, 0.10)"
          value={formatNaira(sum.total_pending_ngn)}
          label="Pending"
          delay={150}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="#001a40"
          iconBgColor="#f0f4ff"
          value={String(sum.closings_count)}
          label="Total closings"
          delay={200}
        />
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
          <h2 className="text-h4 text-navy">Closings ledger</h2>
          <span className="text-caption text-subtle">{items.length} entries</span>
        </div>
        {items.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No closings yet. Commissions appear here when a deal is signed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Buyer</th>
                  <th className="px-6 py-3">Closed</th>
                  <th className="px-6 py-3">Sale price</th>
                  <th className="px-6 py-3">Commission</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-beige/30">
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {c.property_title || `#${c.property_id || '—'}`}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {c.buyer_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatDateTime(c.closing_date)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy">
                      {formatNaira(c.sale_price_ngn)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-verified">
                      {formatNaira(c.commission_ngn)}
                      <span className="text-caption text-subtle font-normal ml-1">
                        ({Math.round(c.commission_rate * 100)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-caption font-semibold ${
                          c.status === 'paid'
                            ? 'bg-verified-light text-verified'
                            : c.status === 'in_escrow'
                              ? 'bg-warning-light text-warning'
                              : 'bg-action-light text-action'
                        }`}
                      >
                        {c.status === 'in_escrow' ? 'in escrow' : c.status}
                      </span>
                    </td>
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
