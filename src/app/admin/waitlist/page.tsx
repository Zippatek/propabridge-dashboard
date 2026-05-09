'use client'

/**
 * Waitlist queue — leads captured with status = "waitlisted".
 *
 * Confirmed queue: ADK `GET /leads?status=waitlisted&intent=…` (via
 * `/api/admin/adk/...`).
 *
 * **Likely (from chats)** is pre-waitlist: `GET /leads/waitlist-candidates` —
 * heuristic signals only; promote sets `status=waitlisted` and
 * `waitlist_source=chat_heuristic`. Older transcripts may lack user text in
 * `events` — signals then lean on ai_promises and tool traces.
 *
 * Tabs split the queue by intent (rent / buy / invest) — the same axes the
 * agent uses to record lead requirements via `capture_lead`.
 */

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { ListChecks, MessageSquare, Phone, Mail } from 'lucide-react'
import type { AdkLead, WaitlistCandidate } from '@/lib/types'
import { adk } from '@/lib/client-api'
import { scoreClass, formatRelativeTime, formatNaira } from '@/lib/format'
import { displayLeadLabel } from '@/lib/display-name'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

type Tab = 'all' | 'likely' | 'rent' | 'buy' | 'invest'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'likely', label: 'Likely (from chats)' },
  { id: 'rent', label: 'Rent' },
  { id: 'buy', label: 'Buy' },
  { id: 'invest', label: 'Invest' },
]

function budgetLabel(lead: AdkLead): string {
  if (typeof lead.budget === 'number') return formatNaira(lead.budget)
  if (lead.budget) return String(lead.budget)
  return '—'
}

function waitlistCriteriaSnippet(lead: AdkLead): string {
  const wc = lead.waitlist_criteria as Record<string, unknown> | undefined | null
  if (wc && typeof wc === 'object') {
    const latest = wc.latest_promise_backfill as Record<string, unknown> | undefined
    const lt = latest?.promise_text as string | undefined
    const pt = wc.promise_text as string | undefined
    const blob = lt || pt
    if (blob && typeof blob === 'string') return blob.replace(/\s+/g, ' ').slice(0, 140)
  }
  const notes = typeof lead.notes === 'string' ? lead.notes.trim() : ''
  if (notes && notes.startsWith('[waitlist/')) {
    const rest = notes.split('\n')[0]?.replace(/^\[[^\]]+\]\s*/, '') ?? ''
    return rest.slice(0, 140)
  }
  return '—'
}

function waitlistSourceLabel(lead: AdkLead): string {
  const pid = lead.waitlist_source_promise_id
  if (pid && typeof pid === 'string') return pid.length > 16 ? `promise ${pid.slice(0, 14)}…` : `promise ${pid}`
  if (lead.session_id) return 'chat'
  return '—'
}

export default function AdminWaitlistPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [leads, setLeads] = useState<AdkLead[] | null>(null)
  const [candidates, setCandidates] = useState<WaitlistCandidate[] | null>(
    null,
  )
  const [candidateDays] = useState(30)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    setPageError(null)
    setToast(null)
    if (tab === 'likely') {
      setLeads(null)
      setCandidates(null)
      adk
        .get<{
          items: WaitlistCandidate[]
          note?: string
        }>(
          `/leads/waitlist-candidates?days=${encodeURIComponent(String(candidateDays))}`,
        )
        .then((d) => setCandidates(d.items || []))
        .catch((e) => setPageError((e as Error).message))
      return
    }
    setCandidates(null)
    setLeads(null)
    const params = new URLSearchParams()
    params.set('status', 'waitlisted')
    params.set('min_score', '0') // aligns with ADK: explicit 0 skips funnel default (80)
    params.set('limit', '200')
    if (tab !== 'all') params.set('intent', tab)

    adk
      .get<{ items: AdkLead[] }>(`/leads?${params}`)
      .then((d) => setLeads(d.items || []))
      .catch((e) => setPageError((e as Error).message))
  }, [tab, candidateDays])

  const counts = useMemo(() => {
    if (!leads) return null
    const byIntent = { rent: 0, buy: 0, invest: 0, other: 0 }
    for (const l of leads) {
      const i = (l.intent || '').toLowerCase()
      if (i === 'rent' || i === 'buy' || i === 'invest') byIntent[i] += 1
      else byIntent.other += 1
    }
    return byIntent
  }, [leads])

  async function promoteOne(sessionId: string) {
    setPromotingId(sessionId)
    setToast(null)
    try {
      await adk.send(`/leads/promote-waitlist-candidates`, 'POST', {
        session_ids: [sessionId],
      })
      setToast({
        type: 'success',
        message: 'Promoted to waitlist. Refreshed Likely list and confirmed queue.',
      })
      const [candRefresh, _waitlistedRefetch] = await Promise.all([
        adk.get<{ items: WaitlistCandidate[] }>(
          `/leads/waitlist-candidates?days=${encodeURIComponent(String(candidateDays))}`,
        ),
        adk.get<{ items: AdkLead[] }>(
          `/leads?status=waitlisted&min_score=0&limit=200`,
        ),
      ])
      void _waitlistedRefetch
      setCandidates(candRefresh.items || [])
    } catch (e) {
      setToast({ type: 'error', message: (e as Error).message })
    } finally {
      setPromotingId(null)
    }
  }

  if (pageError) return <PageError message={pageError} />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <ListChecks size={22} strokeWidth={1.8} className="text-action" />
            Waitlist
          </h1>
          <p className="text-body-sm text-subtle mt-1 max-w-3xl">
            <strong className="text-navy font-semibold">Confirmed waitlist</strong>{' '}
            (Rent / Buy / Invest / All tabs) lists leads with{' '}
            <code className="text-caption bg-beige px-1 rounded">status=waitlisted</code>{' '}
            — the agent explicitly captured them or ops promoted them.{' '}
            <strong className="text-navy font-semibold">Likely (from chats)</strong>{' '}
            is a pre-waitlist heuristic: people who probably hit a no-match path but
            are not yet on the confirmed queue; use Promote to add them.
          </p>
        </div>
        {tab === 'likely' && candidates !== null && (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-body-sm font-semibold px-3 py-1.5 rounded-badge border border-amber-200/80">
            {candidates.length} likely (last {candidateDays}d)
          </span>
        )}
        {tab !== 'likely' && leads !== null && (
          <span className="inline-flex items-center gap-1.5 bg-action-light text-action text-body-sm font-semibold px-3 py-1.5 rounded-badge border border-action/20">
            {leads.length} on {tab === 'all' ? 'waitlist' : `${tab} waitlist`}
          </span>
        )}
      </div>

      {toast ? (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-body-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-caption font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-1 bg-beige rounded-lg p-1 w-fit border border-divider">
        {TABS.map((t) => {
          const active = tab === t.id
          const count =
            t.id === 'all'
              ? leads?.length
              : t.id === 'likely'
                ? candidates?.length
                : counts
                  ? (counts as Record<string, number>)[t.id] ?? 0
                  : undefined
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-md text-body-sm font-semibold transition-all duration-150 ${
                active
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-subtle hover:text-navy'
              }`}
            >
              {t.label}
              {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up">
        {tab === 'likely' && candidates === null ? (
          <PageLoading />
        ) : tab === 'likely' && candidates?.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ListChecks
              size={42}
              strokeWidth={1.2}
              className="mx-auto text-subtle mb-3"
            />
            <p className="text-body-sm text-subtle">
              No heuristic matches in the last {candidateDays} days.
            </p>
            <p className="text-caption text-subtle max-w-lg mx-auto">
              Sparse user text in historical <code className="text-caption">events</code>{' '}
              rows reduces recall — check <code className="text-caption">ai_promises</code>{' '}
              backlog or run WhatsApp transcripts with tooling enabled.
            </p>
          </div>
        ) : tab === 'likely' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Reasons</th>
                  <th className="px-6 py-3">Snippet</th>
                  <th className="px-6 py-3">Last activity</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {(candidates ?? []).map((c) => (
                  <tr
                    key={c.session_id}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">
                        {displayLeadLabel({
                          name: c.lead_name,
                          phone: c.phone,
                        })}
                      </p>
                      <p className="text-caption text-subtle flex items-center gap-1 mt-0.5">
                        {c.phone ? (
                          <>
                            <Phone size={11} strokeWidth={1.8} />
                            {c.phone}
                          </>
                        ) : (
                          '—'
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-caption font-bold ${scoreClass(c.score)}`}
                      >
                        {c.score}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle max-w-[14rem]">
                      <ul className="list-disc list-inside space-y-0.5">
                        {c.reasons.map((r, i) => (
                          <li key={`${i}-${r}`}>{r}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle max-w-[18rem] whitespace-pre-wrap">
                      {c.snippet}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle whitespace-nowrap">
                      {c.last_message_at
                        ? formatRelativeTime(c.last_message_at)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-y-2">
                      <button
                        type="button"
                        disabled={promotingId === c.session_id}
                        onClick={() => promoteOne(c.session_id)}
                        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-white bg-action hover:bg-action-hover disabled:opacity-50 px-3 py-1.5 rounded-button"
                      >
                        <ListChecks size={14} strokeWidth={2} />
                        {promotingId === c.session_id
                          ? 'Promoting…'
                          : 'Promote to waitlist'}
                      </button>
                      <div>
                        <Link
                          href={`/admin/conversations?id=${encodeURIComponent(c.session_id)}`}
                          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button"
                        >
                          <MessageSquare size={12} strokeWidth={2} />
                          Open chat
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : leads === null ? (
          <PageLoading />
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <ListChecks
              size={42}
              strokeWidth={1.2}
              className="mx-auto text-subtle mb-3"
            />
            <p className="text-body-sm text-subtle">
              {tab === 'all'
                ? 'No leads on the waitlist right now.'
                : `No ${tab}-intent leads on the waitlist right now.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Looking for</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Criteria</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Captured</th>
                  <th className="px-6 py-3">Match alert</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy">
                        {displayLeadLabel(lead)}
                      </p>
                      <p className="text-caption text-subtle flex items-center gap-2 mt-0.5">
                        {lead.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={11} strokeWidth={1.8} />
                            {lead.phone}
                          </span>
                        ) : null}
                        {lead.email ? (
                          <span className="flex items-center gap-1">
                            <Mail size={11} strokeWidth={1.8} />
                            {lead.email}
                          </span>
                        ) : null}
                        {!lead.phone && !lead.email ? '—' : null}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-body-sm text-navy capitalize">
                        {lead.intent || 'unknown'}
                        {lead.property_type ? ` · ${lead.property_type}` : ''}
                        {lead.bedrooms ? ` · ${lead.bedrooms}bd` : ''}
                      </p>
                      <p className="text-caption text-subtle">
                        {lead.location_preference || 'No location'}
                        {lead.timeline ? ` · ${lead.timeline}` : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">
                      {budgetLabel(lead)}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle capitalize">
                      {waitlistSourceLabel(lead)}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle max-w-[14rem] truncate" title={waitlistCriteriaSnippet(lead)}>
                      {waitlistCriteriaSnippet(lead)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-caption font-bold ${scoreClass(lead.score)}`}
                      >
                        {lead.score ?? 0}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">
                      {formatRelativeTime(lead.created_at)}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle whitespace-nowrap">
                      {lead.last_waitlist_notify_at
                        ? formatRelativeTime(lead.last_waitlist_notify_at)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/conversations?id=${encodeURIComponent(
                          lead.session_id || lead.id,
                        )}`}
                        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-1.5 rounded-button"
                      >
                        <MessageSquare size={12} strokeWidth={2} />
                        Open chat
                      </Link>
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
