'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bot,
  CalendarClock,
  ChevronDown,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserRoundCog,
  Plus,
  X,
  User,
} from 'lucide-react'
import type { UserRelationshipProfile } from '@/lib/types'
import { adk } from '@/lib/client-api'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

const STAGES = [
  'all',
  'new',
  'fresh_start',
  'qualifying',
  'qualified',
  'hot_lead',
  'waitlisted',
  'viewing_scheduled',
  'converted',
  'opted_out',
]

function stageClass(stage?: string | null) {
  switch ((stage || '').toLowerCase()) {
    case 'hot_lead':
      return 'bg-danger-light text-danger'
    case 'qualified':
    case 'viewing_scheduled':
    case 'converted':
      return 'bg-verified-light text-verified'
    case 'waitlisted':
    case 'fresh_start':
      return 'bg-action-light text-action'
    case 'opted_out':
      return 'bg-beige text-subtle'
    default:
      return 'bg-gold-light text-[#5d3e02]'
  }
}

function riskClass(score?: number | null) {
  const s = score ?? 0
  if (s >= 70) return 'text-danger bg-danger-light'
  if (s >= 40) return 'text-[#5d3e02] bg-gold-light'
  return 'text-verified bg-verified-light'
}

function normalizeStage(stage: string) {
  return stage.replace(/_/g, ' ')
}

export default function AdminRelationshipsPage() {
  const [profiles, setProfiles] = useState<UserRelationshipProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [backendMissing, setBackendMissing] = useState(false)
  const [stage, setStage] = useState('all')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  const [noteSaving, setNoteSaving] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const load = async () => {
    setRefreshing(true)
    setError(null)
    setBackendMissing(false)
    const params = new URLSearchParams()
    params.set('limit', '500')
    if (stage !== 'all') params.set('stage', stage)
    try {
      const data = await adk.get<{ items: UserRelationshipProfile[] }>(
        `/relationship-profiles?${params}`,
      )
      setProfiles(data.items || [])
    } catch (e) {
      const message = (e as Error).message
      if (message.toLowerCase().includes('not found') || message.includes('404')) {
        setProfiles([])
        setBackendMissing(true)
      } else {
        setError(message)
      }
    } finally {
      setRefreshing(false)
    }
  }

  const saveNote = async (profileId: string, sessionId: string) => {
    if (!noteText.trim()) return
    setNoteSaving(profileId)
    try {
      await fetch('/api/admin/adk/relationship-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          sessionId,
          note: noteText.trim(),
          agentName: 'admin',
        }),
      })
      setNoteText('')
      setExpandedNoteId(null)
      // Refresh profiles to show the new note
      await load()
    } catch (e) {
      console.error('Failed to save note:', e)
    } finally {
      setNoteSaving(null)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const filtered = useMemo(() => {
    const list = profiles || []
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((p) => {
      return [
        p.user_id,
        p.phone,
        p.profile_name,
        p.active_session_id,
        p.lead_id,
        p.relationship_stage,
        p.intent,
        p.budget,
        p.property_type,
        p.relationship_summary,
        p.next_best_action,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [profiles, query])

  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const p of profiles || []) {
      const s = p.relationship_stage || 'new'
      out[s] = (out[s] || 0) + 1
    }
    return out
  }, [profiles])

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <UserRoundCog size={24} strokeWidth={1.8} className="text-action" />
            Relationship Manager
          </h1>
          <p className="text-body-sm text-subtle mt-1 max-w-3xl">
            Persistent Propa profiles for every user: memory summary, stage,
            next best action, follow-up cadence, conversion score, and churn risk.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-button bg-action-light text-action hover:bg-action hover:text-white px-4 py-2 text-body-sm font-semibold transition-colors disabled:opacity-60"
        >
          <RefreshCw size={15} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {backendMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-body-sm text-amber-900">
          Relationship Manager UI is installed, but the ADK backend currently deployed behind
          <code className="mx-1 rounded bg-white/70 px-1">PROPA_ADK_BASE</code>
          does not expose
          <code className="mx-1 rounded bg-white/70 px-1">/api/admin/relationship-profiles</code>
          yet. Redeploy the updated ADK service, then refresh this page.
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-up">
        <div className="bg-white rounded-card border border-divider shadow-card p-5">
          <p className="text-caption text-subtle uppercase tracking-wider font-semibold">Profiles</p>
          <p className="text-h3 text-navy mt-1">{profiles?.length ?? '—'}</p>
        </div>
        <div className="bg-white rounded-card border border-divider shadow-card p-5">
          <p className="text-caption text-subtle uppercase tracking-wider font-semibold">Hot Leads</p>
          <p className="text-h3 text-danger mt-1">{counts.hot_lead || 0}</p>
        </div>
        <div className="bg-white rounded-card border border-divider shadow-card p-5">
          <p className="text-caption text-subtle uppercase tracking-wider font-semibold">Waitlisted</p>
          <p className="text-h3 text-action mt-1">{counts.waitlisted || 0}</p>
        </div>
        <div className="bg-white rounded-card border border-divider shadow-card p-5">
          <p className="text-caption text-subtle uppercase tracking-wider font-semibold">Fresh Starts</p>
          <p className="text-h3 text-navy mt-1">{counts.fresh_start || 0}</p>
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card p-5 flex flex-col lg:flex-row gap-4 lg:items-end animate-fade-up animate-fade-up-2">
        <div className="flex-1">
          <label className="block text-nav font-medium text-navy mb-2">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search user, phone, summary, next action..."
            className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
          />
        </div>
        <div className="w-full lg:w-64">
          <label className="block text-nav font-medium text-navy mb-2">Stage</label>
          <div className="relative">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-4 py-3 rounded-input border border-divider bg-white text-body text-navy focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent appearance-none pr-10 capitalize"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All stages' : normalizeStage(s)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden animate-fade-up animate-fade-up-3">
        <div className="px-6 py-4 border-b border-divider flex items-center justify-between gap-3">
          <h2 className="text-h4 text-navy">User Relationship Profiles</h2>
          <span className="text-caption text-subtle">
            {profiles === null ? '—' : `${filtered.length} shown`}
          </span>
        </div>

        {profiles === null ? (
          <PageLoading />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-body-sm text-subtle">
            No relationship profiles match this filter.
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {filtered.map((profile) => {
              const stageLabel = profile.relationship_stage || 'new'
              const sessionId = profile.active_session_id || profile.user_id
              return (
                <article key={profile.id} className="p-6 hover:bg-beige/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-navy truncate">
                          {profile.profile_name || profile.phone || profile.user_id}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-badge capitalize ${stageClass(stageLabel)}`}>
                          {normalizeStage(stageLabel)}
                        </span>
                        {profile.opted_out && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-badge bg-danger-light text-danger">
                            Opted out
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-subtle mt-1 flex items-center gap-1.5">
                        <Phone size={12} strokeWidth={1.8} />
                        {profile.phone || profile.user_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/conversations?id=${encodeURIComponent(sessionId)}`}
                        className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-action bg-action-light hover:bg-action hover:text-white px-3 py-2 rounded-button transition-colors"
                      >
                        <MessageSquare size={13} strokeWidth={2} />
                        Open chat
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_220px] gap-5 mt-5">
                    <div className="space-y-3">
                      <div>
                        <p className="text-caption text-placeholder uppercase tracking-wider font-semibold">Memory Summary</p>
                        <p className="text-body-sm text-navy leading-relaxed mt-1">
                          {profile.relationship_summary || 'No memory summary captured yet.'}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption text-placeholder uppercase tracking-wider font-semibold">Next Best Action</p>
                        <p className="text-body-sm text-navy font-semibold leading-relaxed mt-1">
                          {profile.next_best_action || 'Continue qualification.'}
                        </p>
                      </div>

                      {/* Notes Section */}
                      <div className="mt-4 pt-4 border-t border-divider">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="text-caption text-placeholder uppercase tracking-wider font-semibold">Notes</p>
                          {expandedNoteId !== profile.id && (
                            <button
                              onClick={() => setExpandedNoteId(profile.id)}
                              className="text-action hover:text-action/80 transition-colors"
                              title="Add note"
                            >
                              <Plus size={16} strokeWidth={2} />
                            </button>
                          )}
                        </div>

                        {/* Notes Display */}
                        {profile.notes && profile.notes.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {profile.notes.slice(0, 3).map((note) => (
                              <div
                                key={note.id}
                                className="rounded-lg bg-beige/40 border border-divider p-3 text-body-xs"
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  {note.author_type === 'ai' ? (
                                    <Bot size={12} className="text-action flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <User size={12} className="text-subtle flex-shrink-0 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-placeholder font-semibold">
                                      {note.author_type === 'ai' ? '🤖 AI' : '👤 Human'}{' '}
                                      {note.author_id ? `• ${note.author_id}` : ''}
                                    </p>
                                    <p className="text-subtle text-[10px]">{formatRelativeTime(note.created_at)}</p>
                                  </div>
                                </div>
                                <p className="text-navy line-clamp-2">{note.content}</p>
                              </div>
                            ))}
                            {profile.notes.length > 3 && (
                              <p className="text-caption text-placeholder text-center py-1">
                                +{profile.notes.length - 3} more notes
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* Note Form */}
                        {expandedNoteId === profile.id && (
                          <div className="rounded-lg bg-beige/20 border border-divider p-3 space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add an observation or important detail..."
                              className="w-full px-3 py-2 rounded-input border border-divider bg-white text-body-xs text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent resize-none"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setExpandedNoteId(null)
                                  setNoteText('')
                                }}
                                className="px-3 py-1.5 rounded-button text-body-xs font-semibold text-placeholder bg-transparent hover:bg-beige/50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveNote(profile.id, sessionId)}
                                disabled={noteSaving === profile.id || !noteText.trim()}
                                className="px-3 py-1.5 rounded-button text-body-xs font-semibold text-white bg-action hover:bg-action/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {noteSaving === profile.id ? 'Saving...' : 'Save Note'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-body-sm">
                      <div className="rounded-lg bg-beige/70 border border-divider p-3">
                        <p className="text-caption text-subtle">Intent</p>
                        <p className="font-semibold text-navy capitalize">{profile.intent || '—'}</p>
                      </div>
                      <div className="rounded-lg bg-beige/70 border border-divider p-3">
                        <p className="text-caption text-subtle">Budget</p>
                        <p className="font-semibold text-navy">{profile.budget || '—'}</p>
                      </div>
                      <div className="rounded-lg bg-beige/70 border border-divider p-3">
                        <p className="text-caption text-subtle">Property</p>
                        <p className="font-semibold text-navy capitalize">{profile.property_type || '—'}</p>
                      </div>
                      <div className="rounded-lg bg-beige/70 border border-divider p-3">
                        <p className="text-caption text-subtle">Bedrooms</p>
                        <p className="font-semibold text-navy">{profile.bedrooms ?? '—'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-divider bg-white p-3 text-center">
                          <TrendingUp size={14} className="mx-auto text-action" />
                          <p className="text-[10px] text-placeholder uppercase font-semibold mt-1">Engage</p>
                          <p className="font-bold text-navy">{profile.engagement_score ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-divider bg-white p-3 text-center">
                          <ShieldCheck size={14} className="mx-auto text-verified" />
                          <p className="text-[10px] text-placeholder uppercase font-semibold mt-1">Convert</p>
                          <p className="font-bold text-navy">{profile.conversion_score ?? 0}</p>
                        </div>
                        <div className={`rounded-lg border border-divider p-3 text-center ${riskClass(profile.risk_of_churn)}`}>
                          <Bot size={14} className="mx-auto" />
                          <p className="text-[10px] uppercase font-semibold mt-1">Risk</p>
                          <p className="font-bold">{profile.risk_of_churn ?? 0}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-beige/70 border border-divider p-3 text-caption text-subtle space-y-1">
                        <p className="flex items-center gap-1.5">
                          <CalendarClock size={12} strokeWidth={1.8} />
                          Next follow-up: {formatDateTime(profile.next_followup_at)}
                        </p>
                        <p>Last contacted: {formatDateTime(profile.last_contacted_at)}</p>
                        <p>Updated: {formatRelativeTime(profile.updated_at)}</p>
                        <p>Resets: {profile.reset_count ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
