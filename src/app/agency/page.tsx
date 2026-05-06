'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  Calendar,
  BadgeDollarSign,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import { StatCard } from '@/components/ui'
import { agency } from '@/lib/agency-api'
import { formatNaira } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Overview {
  listings_active: number
  listings_pending?: number
  leads_total: number
  leads_new: number
  inspections_upcoming: number
  inspections_completed: number
  commission_pending_ngn: number
  commission_paid_ngn: number
}

export default function AgencyOverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    agency
      .get<Overview>('/overview')
      .then(setData)
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error)
    return (
      <PageError
        message={`${error} — backend /agency/overview not yet wired (see DASHBOARDS_README).`}
      />
    )
  if (!data) return <PageLoading />

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-card animate-fade-up gradient-navy-radial p-8 lg:p-10 text-on-dark-primary">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-lg">
            <p className="badge-text text-gold uppercase tracking-wide">Agency Portal</p>
            <h2 className="text-[28px] lg:text-[32px] font-bold mt-2 leading-tight text-on-dark-primary">
              Welcome back to your dashboard.
            </h2>
            <p className="text-on-dark-secondary mt-3">
              {data.leads_new} new lead{data.leads_new === 1 ? '' : 's'} ·{' '}
              {data.inspections_upcoming} upcoming viewing
              {data.inspections_upcoming === 1 ? '' : 's'} ·{' '}
              {formatNaira(data.commission_pending_ngn)} commission pending
            </p>
          </div>
          <Link href="/agency/listings">
            <button className="bg-action hover:bg-action-hover text-white font-semibold px-6 py-3 rounded-button flex items-center gap-2">
              Add a listing <ArrowUpRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          iconColor="#001a40"
          iconBgColor="#f0f4ff"
          value={String(data.listings_active)}
          label="Active listings"
          trend={data.listings_pending ? `${data.listings_pending} pending review` : undefined}
          delay={50}
        />
        <StatCard
          icon={Users}
          iconColor="#006aff"
          iconBgColor="rgba(0, 106, 255, 0.10)"
          value={String(data.leads_total)}
          label="Total leads"
          trend={data.leads_new ? `+${data.leads_new} new` : undefined}
          delay={100}
        />
        <StatCard
          icon={Calendar}
          iconColor="#ffc870"
          iconBgColor="rgba(255, 200, 112, 0.15)"
          value={String(data.inspections_upcoming)}
          label="Upcoming inspections"
          trend={`${data.inspections_completed} completed`}
          delay={150}
        />
        <StatCard
          icon={BadgeDollarSign}
          iconColor="#1a7a4a"
          iconBgColor="rgba(26, 122, 74, 0.10)"
          value={formatNaira(data.commission_pending_ngn)}
          label="Commission pending"
          trend={`${formatNaira(data.commission_paid_ngn)} paid YTD`}
          delay={200}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          href="/agency/leads"
          className="bg-white rounded-card border border-divider shadow-card p-6 card-lift block group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-card bg-action-light text-action flex items-center justify-center">
              <Users size={20} strokeWidth={1.6} />
            </div>
            <ArrowUpRight
              size={16}
              className="text-subtle group-hover:text-action group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <h3 className="text-h4 text-navy">View {data.leads_new} new leads</h3>
          <p className="text-caption text-subtle mt-1">
            Pre-qualified buyers Propa has matched to your portfolio.
          </p>
        </Link>

        <Link
          href="/agency/commissions"
          className="bg-white rounded-card border border-divider shadow-card p-6 card-lift block group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-card bg-verified-light text-verified flex items-center justify-center">
              <TrendingUp size={20} strokeWidth={1.6} />
            </div>
            <ArrowUpRight
              size={16}
              className="text-subtle group-hover:text-action group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <h3 className="text-h4 text-navy">Commission ledger</h3>
          <p className="text-caption text-subtle mt-1">
            Closings in pipeline, paid commissions, and pending payouts.
          </p>
        </Link>
      </section>
    </div>
  )
}
