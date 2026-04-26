'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Flame,
  Calendar,
  Building2,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import { StatCard } from '@/components/ui'
import { adk, be } from '@/lib/client-api'
import type {
  OverviewKPIs,
  FunnelCounts,
  AdkLead,
  BackendLead,
  BackendAppointment,
} from '@/lib/types'
import { scoreClass } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

export default function AdminOverviewPage() {
  const [kpi, setKpi] = useState<OverviewKPIs | null>(null)
  const [funnel, setFunnel] = useState<FunnelCounts | null>(null)
  const [hot, setHot] = useState<AdkLead[]>([])
  const [beLeads, setBeLeads] = useState<BackendLead[]>([])
  const [appts, setAppts] = useState<BackendAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const results = await Promise.allSettled([
          adk.get<OverviewKPIs>('/overview'),
          adk.get<FunnelCounts>('/funnel'),
          adk.get<{ items: AdkLead[] }>('/leads?min_score=80&limit=5'),
          be.get<{ items?: BackendLead[]; data?: BackendLead[] } | BackendLead[]>('/leads?limit=200'),
          be.get<{ items?: BackendAppointment[]; data?: BackendAppointment[] } | BackendAppointment[]>(
            '/scheduler/appointments?limit=200',
          ),
        ])
        if (!alive) return

        if (results[0].status === 'fulfilled') setKpi(results[0].value)
        if (results[1].status === 'fulfilled') setFunnel(results[1].value)
        if (results[2].status === 'fulfilled') setHot(results[2].value.items || [])
        if (results[3].status === 'fulfilled') {
          const v = results[3].value as { items?: BackendLead[]; data?: BackendLead[] } | BackendLead[]
          setBeLeads(Array.isArray(v) ? v : v.items || v.data || [])
        }
        if (results[4].status === 'fulfilled') {
          const v = results[4].value as
            | { items?: BackendAppointment[]; data?: BackendAppointment[] }
            | BackendAppointment[]
          setAppts(Array.isArray(v) ? v : v.items || v.data || [])
        }

        const allFailed = results.every((r) => r.status === 'rejected')
        if (allFailed) {
          setError(
            (results[0] as PromiseRejectedResult).reason?.message ||
              'All upstream services unreachable',
          )
        }
      } catch (e) {
        if (alive) setError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <PageLoading />
  if (error) return <PageError message={error} />

  const inquiriesTotal = beLeads.length
  const inquiriesNew = beLeads.filter((l) => (l.status || '').toLowerCase() === 'new').length
  const apptsTotal = appts.length
  const apptsUpcoming = appts.filter((a) => {
    const when = a.scheduled_for || a.date
    return when ? new Date(when).getTime() > Date.now() : false
  }).length

  return (
    <div className="space-y-8">
      {/* AI agent KPIs */}
      <section>
        <p className="text-caption text-placeholder uppercase tracking-wider font-semibold mb-3">
          AI Agent · Propabridge ADK
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            iconColor="#006aff"
            iconBgColor="rgba(0, 106, 255, 0.10)"
            value={String(kpi?.leads_total ?? 0)}
            label="Total leads captured"
            trend={kpi ? `+${kpi.leads_week} this week` : undefined}
            delay={50}
          />
          <StatCard
            icon={Flame}
            iconColor="#d97706"
            iconBgColor="rgba(217, 119, 6, 0.10)"
            value={String(kpi?.hot_leads ?? 0)}
            label="Hot leads (score ≥ 80)"
            delay={100}
          />
          <StatCard
            icon={Calendar}
            iconColor="#1a7a4a"
            iconBgColor="rgba(26, 122, 74, 0.10)"
            value={String(kpi?.bookings_total ?? 0)}
            label="AI-booked viewings"
            trend={kpi ? `+${kpi.bookings_week} this week` : undefined}
            delay={150}
          />
          <StatCard
            icon={Building2}
            iconColor="#001a40"
            iconBgColor="#f0f4ff"
            value={String(kpi?.listings_active ?? 0)}
            label="Featured listings"
            delay={200}
          />
        </div>
      </section>

      {/* Operations KPIs */}
      <section>
        <p className="text-caption text-placeholder uppercase tracking-wider font-semibold mb-3">
          Operations · Propabridge Backend
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Mail}
            iconColor="#006aff"
            iconBgColor="rgba(0, 106, 255, 0.10)"
            value={String(inquiriesTotal)}
            label="Total inquiries"
            trend={inquiriesNew ? `${inquiriesNew} new` : undefined}
            delay={50}
          />
          <StatCard
            icon={Calendar}
            iconColor="#ffc870"
            iconBgColor="rgba(255, 200, 112, 0.15)"
            value={String(apptsTotal)}
            label="All inspection requests"
            delay={100}
          />
          <StatCard
            icon={Calendar}
            iconColor="#1a7a4a"
            iconBgColor="rgba(26, 122, 74, 0.10)"
            value={String(apptsUpcoming)}
            label="Upcoming inspections"
            delay={150}
          />
        </div>
      </section>

      {/* Funnel */}
      {funnel && (
        <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up animate-fade-up-3">
          <div className="px-6 py-4 border-b border-divider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-action" strokeWidth={1.8} />
              <h2 className="text-h4 text-navy">Lead Funnel</h2>
            </div>
            <span className="text-caption text-subtle">
              {funnel.total_leads} total leads tracked
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-divider">
            {[
              { label: 'All Leads', value: funnel.total_leads, color: 'text-navy' },
              { label: 'With Intent', value: funnel.with_intent, color: 'text-action' },
              { label: 'With Location', value: funnel.with_location, color: 'text-action' },
              { label: 'Qualified (≥50)', value: funnel.qualified, color: 'text-gold' },
              { label: 'Booked', value: funnel.booked, color: 'text-verified' },
            ].map((step) => {
              const pct =
                funnel.total_leads > 0
                  ? Math.round((step.value / funnel.total_leads) * 100)
                  : 0
              return (
                <div key={step.label} className="p-5">
                  <p className="text-caption text-subtle uppercase tracking-wide font-semibold">
                    {step.label}
                  </p>
                  <p className={`text-h2 mt-2 ${step.color}`}>{step.value}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-beige overflow-hidden">
                    <div
                      className="h-full bg-action transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-caption text-subtle mt-1">{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Hot leads */}
      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up animate-fade-up-4">
        <div className="px-6 py-4 border-b border-divider bg-danger-light/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" strokeWidth={1.8} />
            <h2 className="text-h4 text-navy">Hot Leads — Action Required</h2>
          </div>
          <Link
            href="/admin/leads"
            className="text-nav font-semibold text-action hover:text-action-hover flex items-center gap-1"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        {hot.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            No hot leads at this score threshold.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Intent / Budget</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {hot.map((lead) => (
                <tr key={lead.id} className="hover:bg-beige/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-navy">{lead.name || 'Anonymous'}</div>
                    <div className="text-caption text-subtle">
                      {lead.phone || lead.email || 'No contact'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-body-sm text-navy capitalize">
                      {lead.intent || 'unknown'}
                    </div>
                    <div className="text-caption text-subtle">
                      {lead.budget || 'No budget stated'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-caption font-bold ${scoreClass(lead.score)}`}
                    >
                      {lead.score ?? 0}/100
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/conversations?id=${encodeURIComponent(
                        lead.session_id || lead.id,
                      )}`}
                      className="text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button"
                    >
                      Open chat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
