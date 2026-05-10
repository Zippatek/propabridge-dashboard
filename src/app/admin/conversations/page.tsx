'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Send,
  MessageSquare,
  Phone,
  Mail,
  User,
  Search,
  UserCheck,
  Bot,
  ArrowLeftRight,
  AlertCircle,
  Shield,
  PenLine,
  Save,
  CheckCircle2,
  TrendingUp,
  Brain,
  Clock,
  RefreshCw,
} from 'lucide-react'
import type {
  SessionListItem,
  ConversationDetail,
  TranscriptTurn,
  TakeoverStatus,
  UserRelationshipProfile,
} from '@/lib/types'
import { adk } from '@/lib/client-api'
import { formatRelativeTime, formatDateTime, scoreClass } from '@/lib/format'
import { displayLeadLabel } from '@/lib/display-name'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageError } from '@/components/admin/AsyncBoundary'

/* ─── Mock data (used when ADK backend is unreachable) ───────────────────── */

const MOCK_SESSIONS: SessionListItem[] = [
  {
    id: 'sess-wa-08123456789',
    name: 'Amina Yusuf',
    relationship_stage: 'hot_lead',
    next_best_action: 'Escalate and move toward viewing.',
    risk_of_churn: 12,
    phone: '+2348123456789',
    email: 'amina.y@gmail.com',
    score: 82,
    intent: 'buy',
    created_at: new Date(Date.now() - 3600_000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 60_000 * 5).toISOString(),
  },
  {
    id: 'sess-wa-08098765432',
    name: 'Chukwudi Okonkwo',
    relationship_stage: 'qualified',
    next_best_action: 'Send relevant matches and ask one next-step question.',
    risk_of_churn: 28,
    phone: '+2348098765432',
    email: null,
    score: 65,
    intent: 'rent',
    created_at: new Date(Date.now() - 3600_000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 60_000 * 22).toISOString(),
  },
  {
    id: 'sess-wa-07034567890',
    name: 'Fatimah Bello',
    relationship_stage: 'qualifying',
    next_best_action: 'Explain verification and ask what area/budget they prefer.',
    risk_of_churn: 45,
    phone: '+2347034567890',
    email: 'fatimah.bello@yahoo.com',
    score: 44,
    intent: 'enquiry',
    created_at: new Date(Date.now() - 3600_000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600_000 * 3).toISOString(),
  },
]

const MOCK_TRANSCRIPTS: Record<string, { lead: ConversationDetail['lead']; relationship?: UserRelationshipProfile; transcript: TranscriptTurn[] }> = {
  'sess-wa-08123456789': {
    lead: {
      id: 'lead-001',
      name: 'Amina Yusuf',
      phone: '+2348123456789',
      email: 'amina.y@gmail.com',
      score: 82,
      intent: 'buy',
      budget: '₦45,000,000 – ₦60,000,000',
      property_type: 'detached duplex',
      location_preference: 'Gwarinpa, Abuja',
    },
    relationship: {
      id: 'rel_mock_amina',
      user_id: '+2348123456789',
      active_session_id: 'sess-wa-08123456789',
      assigned_agent_name: 'Propa',
      relationship_stage: 'hot_lead',
      relationship_summary: 'Amina wants a 4-bedroom duplex in Gwarinpa around ₦45M–₦60M and is close to booking a viewing.',
      next_best_action: 'Answer title-document questions and hand off to a human advisor if needed.',
      engagement_score: 85,
      conversion_score: 82,
      risk_of_churn: 12,
      next_followup_at: new Date(Date.now() + 3600_000 * 24).toISOString(),
    },
    transcript: [
      { author: 'user', content: 'Hi, I\'m looking for a 4-bedroom duplex in Gwarinpa', timestamp: new Date(Date.now() - 3600_000 * 2).toISOString() },
      { author: 'assistant', content: 'Welcome to Propabridge! 🏠 I\'d love to help you find a 4-bedroom duplex in Gwarinpa. Let me check our verified listings.\n\nQuick question — what\'s your budget range?', timestamp: new Date(Date.now() - 3600_000 * 2 + 15_000).toISOString() },
      { author: 'user', content: 'Around 45 to 60 million naira', timestamp: new Date(Date.now() - 3600_000 * 1.5).toISOString() },
      { author: 'assistant', content: 'Great budget range! I found 3 verified properties in Gwarinpa that match:\n\n1. 4-bed Detached Duplex, 3rd Avenue — ₦55,000,000\n2. 4-bed Semi-Detached, 5th Avenue — ₦48,000,000\n3. 5-bed Detached with BQ, 1st Avenue — ₦58,000,000\n\nAll are physically inspected and title-verified ✓\n\nWould you like to schedule a free inspection for any of these?', timestamp: new Date(Date.now() - 3600_000 * 1.5 + 20_000).toISOString() },
      { author: 'user', content: 'The first one sounds perfect. Can I see it this Saturday?', timestamp: new Date(Date.now() - 60_000 * 30).toISOString() },
      { author: 'assistant', content: 'Saturday works! I have slots at 10:00 AM and 2:00 PM available for the 3rd Avenue property.\n\nWhich time works better for you? And could you share your full name for the booking?', timestamp: new Date(Date.now() - 60_000 * 29).toISOString() },
      { author: 'user', content: 'I want to speak to a real person please, I have some specific questions about the title documents', timestamp: new Date(Date.now() - 60_000 * 5).toISOString() },
    ],
  },
  'sess-wa-08098765432': {
    lead: {
      id: 'lead-002',
      name: 'Chukwudi Okonkwo',
      phone: '+2348098765432',
      email: null,
      score: 65,
      intent: 'rent',
      budget: '₦2,500,000/yr',
      property_type: 'flat',
      location_preference: 'Wuse 2, Abuja',
    },
    transcript: [
      { author: 'user', content: 'Good afternoon. Looking for a 2-bed flat in Wuse 2', timestamp: new Date(Date.now() - 3600_000 * 8).toISOString() },
      { author: 'assistant', content: 'Good afternoon! Let me find 2-bedroom flats in Wuse 2 for you. What\'s your annual rent budget?', timestamp: new Date(Date.now() - 3600_000 * 8 + 10_000).toISOString() },
      { author: 'user', content: '2.5 million per year max', timestamp: new Date(Date.now() - 3600_000 * 7).toISOString() },
    ],
  },
  'sess-wa-07034567890': {
    lead: {
      id: 'lead-003',
      name: 'Fatimah Bello',
      phone: '+2347034567890',
      email: 'fatimah.bello@yahoo.com',
      score: 44,
      intent: 'enquiry',
      budget: null,
      property_type: null,
      location_preference: 'Maitama',
    },
    transcript: [
      { author: 'user', content: 'Hello, how does your verification process work?', timestamp: new Date(Date.now() - 3600_000 * 24).toISOString() },
      { author: 'assistant', content: 'Hello Fatimah! Great question.\n\nEvery property listed on Propabridge goes through our 3-step verification:\n\n✓ Title Verified — we confirm ownership documents with the land registry\n✓ Physically Inspected — our team visits and photographs the property\n✓ Zero Inspection Fees — you never pay to view a property\n\nWould you like to browse some of our verified listings?', timestamp: new Date(Date.now() - 3600_000 * 24 + 20_000).toISOString() },
    ],
  },
}

/* ─── SSE: session list (with mock fallback) ─────────────────────────────── */

function useSessionStream() {
  const [items, setItems] = useState<SessionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const gotRealData = useRef(false)

  useEffect(() => {
    gotRealData.current = false
    const es = new EventSource('/api/admin/adk-stream/sessions/stream')

    es.addEventListener('sessions', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { items: SessionListItem[] }
        gotRealData.current = true
        setItems(data.items || [])
        setError(null)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('error', () => {
      // Only fall back to mock if we NEVER received real data
      if (es.readyState === EventSource.CLOSED && !gotRealData.current) {
        setItems(MOCK_SESSIONS)
        setError(null)
      }
      // If we had real data, just show a subtle reconnecting note
      if (es.readyState === EventSource.CLOSED && gotRealData.current) {
        setError('Stream disconnected — showing last known data')
      }
    })

    // If no real data arrives within 4 seconds, use mock data
    const timeout = setTimeout(() => {
      if (!gotRealData.current) {
        es.close()
        setItems(MOCK_SESSIONS)
      }
    }, 4000)

    return () => {
      clearTimeout(timeout)
      es.close()
    }
  }, [])

  return { items, error }
}

/* ─── SSE: conversation detail (with mock fallback) ──────────────────────── */

function useConversationStream(sessionId: string | null, bump = 0) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const gotRealData = useRef(false)

  useEffect(() => {
    setDetail(null)
    setError(null)
    gotRealData.current = false
    if (!sessionId) return

    const mockData = MOCK_TRANSCRIPTS[sessionId]

    const es = new EventSource(
      `/api/admin/adk-stream/conversations/${encodeURIComponent(sessionId)}/stream`,
    )

    es.addEventListener('update', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as {
          transcript: TranscriptTurn[]
          lead: ConversationDetail['lead']
          relationship?: UserRelationshipProfile | null
        }
        gotRealData.current = true
        setDetail({
          lead: data.lead,
          relationship: data.relationship || null,
          transcript: data.transcript || [],
          appointments: [],
        })
        setError(null)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('error', () => {
      // Only fall back to mock if we NEVER received real data for this session
      if (es.readyState === EventSource.CLOSED && !gotRealData.current && mockData) {
        setDetail({ lead: mockData.lead, relationship: mockData.relationship || null, transcript: mockData.transcript, appointments: [] })
        setError(null)
      }
    })

    // Fallback timeout — only if no real data arrived
    const timeout = setTimeout(() => {
      if (!gotRealData.current && mockData) {
        es.close()
        setDetail({ lead: mockData.lead, relationship: mockData.relationship || null, transcript: mockData.transcript, appointments: [] })
      }
    }, 3000)

    return () => {
      clearTimeout(timeout)
      es.close()
    }
  }, [sessionId, bump])

  return { detail, error }
}

/* ─── Takeover status hook ───────────────────────────────────────────────── */

function useTakeoverStatus(sessionId: string | null) {
  const [status, setStatus] = useState<TakeoverStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setStatus(null)
      setFetchError(null)
      return
    }
    setFetchError(null)
    try {
      const r = await adk.fetchJson(`/conversations/${encodeURIComponent(sessionId)}/takeover`)
      if (r.ok && r.data && typeof r.data === 'object') {
        const d = r.data as TakeoverStatus
        setStatus({
          ...d,
          is_taken_over: !!(d.is_taken_over ?? d.active ?? false),
        })
        return
      }
      if (r.status === 404) {
        setStatus({ is_taken_over: false })
        return
      }
      setStatus(null)
      const errBody =
        typeof r.data === 'object' && r.data !== null ? (r.data as Record<string, unknown>) : null
      setFetchError(
        String(errBody?.error || errBody?.detail || `Request failed (${r.status})`),
      )
    } catch (e) {
      setStatus(null)
      setFetchError((e as Error).message)
    }
  }, [sessionId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const takeover = async (agentName?: string) => {
    if (!sessionId) return
    setLoading(true)
    setFetchError(null)
    try {
      const r = await adk.fetchJson(`/conversations/${encodeURIComponent(sessionId)}/takeover`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: true, agent_name: agentName || undefined }),
      })
      if (!r.ok) {
        const errBody =
          typeof r.data === 'object' && r.data !== null ? (r.data as Record<string, unknown>) : null
        throw new Error(String(errBody?.error || errBody?.detail || `Request failed (${r.status})`))
      }
      if (r.data && typeof r.data === 'object') {
        const d = r.data as TakeoverStatus
        setStatus({
          ...d,
          is_taken_over: !!(d.is_taken_over ?? d.active ?? false),
        })
      }
    } catch (err) {
      setFetchError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const release = async () => {
    if (!sessionId) return
    setLoading(true)
    setFetchError(null)
    try {
      const r = await adk.fetchJson(`/conversations/${encodeURIComponent(sessionId)}/takeover`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      if (!r.ok) {
        const errBody =
          typeof r.data === 'object' && r.data !== null ? (r.data as Record<string, unknown>) : null
        throw new Error(String(errBody?.error || errBody?.detail || `Request failed (${r.status})`))
      }
      if (r.data && typeof r.data === 'object') {
        const d = r.data as TakeoverStatus
        setStatus({
          ...d,
          is_taken_over: !!(d.is_taken_over ?? d.active ?? false),
        })
      }
    } catch (err) {
      setFetchError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, takeover, release, refresh, fetchError }
}

/* ─── Main view ──────────────────────────────────────────────────────────── */

function ConversationsView() {
  const search = useSearchParams()
  const router = useRouter()
  const selectedId = search.get('id')
  const { items, error: listError } = useSessionStream()
  const [conversationBump, setConversationBump] = useState(0)
  const { detail } = useConversationStream(selectedId, conversationBump)
  const {
    status: takeoverStatus,
    loading: takeoverLoading,
    takeover: rawTakeover,
    release,
    refresh: refreshTakeover,
    fetchError: takeoverFetchError,
  } = useTakeoverStatus(selectedId)

  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [agentNameInput, setAgentNameInput] = useState('')
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)
  const [loadingRelationship, setLoadingRelationship] = useState(false)

  const takeover = async () => {
    if (!isTakenOver) {
      setAgentNameInput('')
      setShowNamePrompt(true)
    } else {
      await rawTakeover()
      setConversationBump((prev) => prev + 1)
    }
  }

  const confirmTakeover = async () => {
    setShowNamePrompt(false)
    await rawTakeover(agentNameInput.trim() || undefined)
    setConversationBump((prev) => prev + 1)
  }
  const [filter, setFilter] = useState('')
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTakenOver =
    !!(takeoverStatus?.is_taken_over ?? takeoverStatus?.active ?? false)

  const takeoverSince =
    takeoverStatus?.taken_over_at ?? takeoverStatus?.updated_at ?? null

  const relationship = detail?.relationship || null

  const leadPhoneLabel =
    detail?.lead?.phone?.startsWith('web:') === true
      ? 'Web visitor'
      : detail?.lead?.phone || '—'

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [detail?.transcript.length])

  // Auto-focus input when takeover activates
  useEffect(() => {
    if (isTakenOver && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTakenOver])

  const select = (id: string) => router.push(`/admin/conversations?id=${encodeURIComponent(id)}`)

  const filtered = (items || []).filter((s) => {
    if (!filter) return true
    const f = filter.toLowerCase()
    return (
      s.id.toLowerCase().includes(f) ||
      (s.name || '').toLowerCase().includes(f) ||
      (s.phone || '').toLowerCase().includes(f)
    )
  })

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !sendBody.trim()) return
    setSending(true)
    setSendError(null)
    try {
      await adk.send(`/conversations/${encodeURIComponent(selectedId)}/send`, 'POST', {
        message: sendBody.trim(),
        as_agent: isTakenOver,
      })
      setSendBody('')
      setConversationBump((b) => b + 1)
      void refreshTakeover()
    } catch (err) {
      setSendError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const saveNote = async () => {
    if (!selectedId || !noteText.trim()) return
    setSavingNote(true)
    setNoteError(null)
    setNoteSaved(false)
    try {
      await adk.send(
        `/conversations/${encodeURIComponent(selectedId)}/relationship/note`,
        'POST',
        { note: noteText.trim(), agent_name: 'admin' },
      )
      setNoteSaved(true)
      setNoteText('')
      setConversationBump((b) => b + 1)
      setTimeout(() => setNoteSaved(false), 3000)
    } catch (e) {
      setNoteError((e as Error).message)
    } finally {
      setSavingNote(false)
    }
  }

  if (listError && !items) return <PageError message={listError} />

  return (
    <div className="bg-white rounded-card border border-divider shadow-card overflow-hidden h-[calc(100vh-9rem)] flex">
      {/* Sessions list */}
      <aside className="w-72 lg:w-80 flex-shrink-0 border-r border-divider flex flex-col">
        <div className="p-4 border-b border-divider bg-beige/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h4 text-navy">Sessions</h2>
            <span className="text-caption font-bold bg-action-light text-action px-2 py-0.5 rounded-badge">
              {items?.length ?? 0}
            </span>
          </div>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              strokeWidth={1.8}
            />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, phone, ID"
              className="w-full pl-8 pr-3 py-2 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items === null ? (
            <div className="p-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-body-sm text-subtle">
              {filter ? 'No matches.' : 'No sessions yet.'}
            </div>
          ) : (
            filtered.map((s) => {
              const active = selectedId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => select(s.id)}
                  className={`w-full text-left p-4 border-b border-divider transition-colors ${
                    active
                      ? 'bg-action-light border-l-[3px] border-l-action'
                      : 'hover:bg-beige/40 border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy text-body-sm truncate">
                      {displayLeadLabel(s)}
                    </p>
                    <span className="text-caption text-subtle whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(s.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-caption text-subtle bg-beige px-1.5 py-0.5 rounded truncate">
                      {String(s.id ?? '').substring(0, 12)}…
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.relationship_stage && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-action-light text-action capitalize">
                          {s.relationship_stage.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreClass(s.score)}`}
                      >
                        Sc: {s.score ?? 0}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Chat view */}
      <section className="flex-1 flex flex-col min-w-0">
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-subtle gap-3">
            <MessageSquare size={48} strokeWidth={1.2} className="text-divider" />
            <p className="text-body-sm">Select a session to monitor</p>
          </div>
        ) : (
          <>
            {/* ─── Chat header with takeover controls ─── */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-divider flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-navy truncate">
                  {detail?.lead ? displayLeadLabel(detail.lead) : 'Unknown'}
                </h3>
                <p className="text-caption text-subtle truncate">ID: {selectedId}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {takeoverFetchError && (
                  <p className="text-caption text-danger max-w-[12rem]" title={takeoverFetchError}>
                    Takeover sync error
                  </p>
                )}
                {relationship?.relationship_stage && (
                  <span className="text-caption font-bold px-2.5 py-1 rounded bg-action-light text-action capitalize">
                    {relationship.relationship_stage.replace(/_/g, ' ')}
                  </span>
                )}
                {detail?.lead.score != null && (
                  <span
                    className={`text-caption font-bold px-2.5 py-1 rounded ${scoreClass(detail.lead.score)}`}
                  >
                    Score {detail.lead.score}/100
                  </span>
                )}

                {/* Takeover / Release button */}
                {detail && (
                  <button
                    onClick={isTakenOver ? release : takeover}
                    disabled={takeoverLoading}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-button text-body-sm font-semibold
                      transition-all duration-200 disabled:opacity-50
                      ${
                        isTakenOver
                          ? 'bg-gold-light text-[#5d3e02] border border-[#ffc870] hover:bg-[#ffeabd]'
                          : 'bg-action hover:bg-action-hover text-white'
                      }
                    `}
                  >
                    {takeoverLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isTakenOver ? (
                      <>
                        <Bot size={16} strokeWidth={1.8} />
                        Release to AI
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} strokeWidth={1.8} />
                        Take Over
                      </>
                    )}
                  </button>
                )}
              </div>
            </header>

            {/* ─── Takeover banner ─── */}
            {isTakenOver && (
              <div className="bg-[#ffc870]/15 border-b border-[#ffc870]/40 px-6 py-3 flex items-center gap-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#ffc870]/25 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} strokeWidth={1.8} className="text-[#5d3e02]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-[#5d3e02]">
                    Human agent mode active
                  </p>
                  <p className="text-caption text-[#7a5a10]">
                    AI is paused. Messages are sent as a human agent via WhatsApp.
                    {takeoverStatus?.auto_sent && (
                      <span className="block mt-0.5 font-medium text-[#5d3e02]">
                        ✓ Takeover welcome message automatically sent to the lead.
                      </span>
                    )}
                    {takeoverSince && <> · Since {formatDateTime(takeoverSince)}</>}
                  </p>
                </div>
                <button
                  onClick={release}
                  disabled={takeoverLoading}
                  className="text-caption font-semibold text-[#5d3e02] hover:text-navy underline underline-offset-2 flex-shrink-0 transition-colors disabled:opacity-50"
                >
                  Hand back to AI
                </button>
              </div>
            )}

            <div className="flex flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-w-0">
                {/* ─── Message thread ─── */}
                <div ref={messagesRef} className="flex-1 overflow-y-auto p-6 space-y-3">
                  {!detail ? (
                    <div className="py-10">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : detail.transcript.length === 0 ? (
                    <p className="text-center text-body-sm text-subtle mt-12">
                      No messages yet.
                    </p>
                  ) : (
                    detail.transcript.map((m, i) => {
                      const isUser = m.author === 'user'
                      const isAgent = m.author === 'agent'
                      const isAssistant = m.author === 'assistant'

                      return (
                        <div
                          key={i}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[80%]">
                            {/* Author label for agent/assistant messages */}
                            {!isUser && (
                              <div className="flex items-center gap-1.5 mb-1">
                                {isAgent ? (
                                  <>
                                    <UserCheck size={12} strokeWidth={1.8} className="text-[#ffc870]" />
                                    <span className="text-[10px] font-semibold text-[#5d3e02] uppercase tracking-wider">
                                      Human Agent
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Bot size={12} strokeWidth={1.8} className="text-action" />
                                    <span className="text-[10px] font-semibold text-action uppercase tracking-wider">
                                      Propa AI
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            <div
                              className={`px-4 py-3 text-body-sm whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-navy text-white rounded-2xl rounded-tr-sm'
                                  : isAgent
                                    ? 'bg-[#ffc870]/15 text-navy rounded-2xl rounded-tl-sm border border-[#ffc870]/40'
                                    : 'bg-beige text-navy rounded-2xl rounded-tl-sm border border-divider'
                              }`}
                            >
                              {m.content}
                            </div>

                            <p
                              className={`text-[10px] text-subtle mt-1 ${isUser ? 'text-right' : ''}`}
                            >
                              {formatDateTime(m.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* ─── Message input ─── */}
                {detail && (
                  <form
                    onSubmit={onSend}
                    className={`border-t p-4 flex-shrink-0 transition-colors duration-200 ${
                      isTakenOver
                        ? 'border-[#ffc870]/40 bg-[#ffc870]/5'
                        : 'border-divider bg-beige/20'
                    }`}
                  >
                    {sendError && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={14} strokeWidth={1.8} className="text-danger flex-shrink-0" />
                        <p className="text-caption text-danger">{sendError}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {/* Mode indicator */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg flex-shrink-0 ${
                          isTakenOver
                            ? 'bg-[#ffc870]/20 text-[#5d3e02]'
                            : 'bg-beige text-subtle'
                        }`}
                        title={isTakenOver ? 'Sending as human agent' : 'Sending as Propa AI'}
                      >
                        {isTakenOver ? (
                          <UserCheck size={16} strokeWidth={1.8} />
                        ) : (
                          <Bot size={16} strokeWidth={1.8} />
                        )}
                      </div>

                      <input
                        ref={inputRef}
                        value={sendBody}
                        onChange={(e) => setSendBody(e.target.value)}
                        placeholder={
                          isTakenOver
                            ? `Reply as human agent to ${leadPhoneLabel}`
                            : `WhatsApp ${leadPhoneLabel} as Propa`
                        }
                        disabled={sending}
                        className={`flex-1 px-4 py-3 rounded-input border bg-white text-body-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 transition-all duration-200 ${
                          isTakenOver
                            ? 'border-[#ffc870]/40 focus:ring-[#ffc870]'
                            : 'border-divider focus:ring-action'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={sending || !sendBody.trim()}
                        className={`font-semibold px-5 py-3 rounded-button transition-all duration-150 flex items-center gap-2 disabled:opacity-50 ${
                          isTakenOver
                            ? 'bg-[#5d3e02] hover:bg-[#7a5a10] text-white'
                            : 'bg-action hover:bg-action-hover text-white'
                        }`}
                      >
                        <Send size={14} strokeWidth={2} />
                        Send
                      </button>
                    </div>
                    {isTakenOver && (
                      <p className="text-[10px] text-[#7a5a10] mt-2 ml-12">
                        You are replying as a human agent. The AI will not respond while takeover is active.
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* ─── User Profile & Memory panel ─── */}
              <aside className="hidden lg:flex w-72 border-l border-divider flex-col bg-white flex-shrink-0">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-divider flex items-center justify-between flex-shrink-0">
                  <p className="text-body-sm font-bold text-navy flex items-center gap-2">
                    <Brain size={15} strokeWidth={1.8} className="text-action" />
                    User Profile & Memory
                  </p>
                  {relationship?.relationship_stage && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-badge capitalize ${
                      relationship.relationship_stage === 'hot_lead'
                        ? 'bg-danger-light text-danger'
                        : relationship.relationship_stage === 'qualified' || relationship.relationship_stage === 'viewing_scheduled'
                        ? 'bg-verified-light text-verified'
                        : relationship.relationship_stage === 'waitlisted' || relationship.relationship_stage === 'fresh_start'
                        ? 'bg-action-light text-action'
                        : 'bg-gold-light text-[#5d3e02]'
                    }`}>
                      {relationship.relationship_stage.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {!detail ? (
                  <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">

                    {/* ── Contact ── */}
                    <div className="px-5 pt-5 pb-4 space-y-3 border-b border-divider">
                      <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider">Contact</p>
                      <div className="space-y-2 text-body-sm">
                        <div className="flex items-center gap-2">
                          <User size={13} strokeWidth={1.5} className="text-subtle flex-shrink-0" />
                          <span className="font-semibold text-navy truncate">{detail.lead.name || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={13} strokeWidth={1.5} className="text-subtle flex-shrink-0" />
                          <span className="text-navy truncate">{leadPhoneLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} strokeWidth={1.5} className="text-subtle flex-shrink-0" />
                          <span className="text-navy truncate">{detail.lead.email || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Agent mode ── */}
                    <div className="px-5 py-4 border-b border-divider">
                      <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider mb-2">Agent Mode</p>
                      <div className="flex items-center gap-2">
                        {isTakenOver ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#ffc870] animate-pulse flex-shrink-0" />
                            <span className="text-[#5d3e02] font-semibold text-body-sm">Human — Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-verified flex-shrink-0" />
                            <span className="text-verified font-semibold text-body-sm">AI — Active</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Requirements ── */}
                    <div className="px-5 py-4 border-b border-divider">
                      <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider mb-3">Requirements</p>
                      <div className="grid grid-cols-2 gap-2 text-body-sm">
                        <div className="bg-beige/60 rounded-lg p-2.5">
                          <p className="text-[10px] text-subtle mb-0.5">Intent</p>
                          <p className="font-semibold text-navy capitalize">{detail.lead.intent || '—'}</p>
                        </div>
                        <div className="bg-beige/60 rounded-lg p-2.5">
                          <p className="text-[10px] text-subtle mb-0.5">Type</p>
                          <p className="font-semibold text-navy capitalize">{detail.lead.property_type || '—'}</p>
                        </div>
                        <div className="bg-beige/60 rounded-lg p-2.5 col-span-2">
                          <p className="text-[10px] text-subtle mb-0.5">Budget</p>
                          <p className="font-semibold text-navy">{detail.lead.budget || '—'}</p>
                        </div>
                        <div className="bg-beige/60 rounded-lg p-2.5 col-span-2">
                          <p className="text-[10px] text-subtle mb-0.5">Location</p>
                          <p className="font-semibold text-navy">{detail.lead.location_preference || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── AI Scores ── */}
                    {relationship && (
                      <div className="px-5 py-4 border-b border-divider">
                        <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingUp size={11} strokeWidth={2} />
                          Engagement Scores
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-action-light/50 border border-action/10 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-action font-bold uppercase">Engage</p>
                            <p className="text-body-sm font-bold text-navy mt-0.5">{relationship.engagement_score ?? 0}</p>
                          </div>
                          <div className="bg-verified-light/50 border border-verified/10 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-verified font-bold uppercase">Convert</p>
                            <p className="text-body-sm font-bold text-navy mt-0.5">{relationship.conversion_score ?? 0}</p>
                          </div>
                          <div className={`rounded-lg p-2 text-center border ${(relationship.risk_of_churn ?? 0) >= 60 ? 'bg-danger-light/40 border-danger/10' : 'bg-beige/60 border-divider'}`}>
                            <p className={`text-[10px] font-bold uppercase ${(relationship.risk_of_churn ?? 0) >= 60 ? 'text-danger' : 'text-subtle'}`}>Risk</p>
                            <p className={`text-body-sm font-bold mt-0.5 ${(relationship.risk_of_churn ?? 0) >= 60 ? 'text-danger' : 'text-navy'}`}>{relationship.risk_of_churn ?? 0}</p>
                          </div>
                        </div>
                        {relationship.next_followup_at && (
                          <p className="text-[10px] text-subtle mt-2.5 flex items-center gap-1.5">
                            <Clock size={10} strokeWidth={2} />
                            Next follow-up: {formatDateTime(relationship.next_followup_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── AI Memory summary ── */}
                    {relationship && (
                      <div className="px-5 py-4 border-b border-divider">
                        <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Brain size={11} strokeWidth={2} />
                          AI Memory Summary
                        </p>
                        <p className="text-caption text-navy leading-relaxed">
                          {relationship.relationship_summary || 'No memory captured yet. Memory builds automatically as Propa talks to this user.'}
                        </p>
                        {relationship.next_best_action && (
                          <div className="mt-3 bg-action-light/40 border border-action/10 rounded-lg p-3">
                            <p className="text-[10px] text-action font-bold uppercase mb-1">Next Best Action</p>
                            <p className="text-caption text-navy leading-relaxed font-medium">
                              {relationship.next_best_action}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Human agent note ── */}
                    <div className="px-5 py-4">
                      <p className="text-[10px] font-bold text-placeholder uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <PenLine size={11} strokeWidth={2} />
                        Add Agent Note
                      </p>
                      <p className="text-[10px] text-subtle mb-2 leading-relaxed">
                        Log an observation. This is saved permanently to the user&apos;s long-term memory and Propa will reference it on future turns.
                      </p>
                      <textarea
                        value={noteText}
                        onChange={(e) => { setNoteText(e.target.value); setNoteError(null); setNoteSaved(false) }}
                        placeholder="e.g. Client said spouse needs to approve before booking. Prefers Saturday viewings."
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-lg border border-divider bg-beige/30 text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent resize-none"
                      />
                      {noteError && (
                        <p className="text-[10px] text-danger mt-1 flex items-center gap-1">
                          <AlertCircle size={10} strokeWidth={2} />
                          {noteError}
                        </p>
                      )}
                      <button
                        onClick={saveNote}
                        disabled={savingNote || !noteText.trim()}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-button text-body-sm font-semibold transition-all duration-150 disabled:opacity-50
                          bg-action text-white hover:bg-action-hover"
                      >
                        {savingNote ? (
                          <RefreshCw size={13} strokeWidth={2} className="animate-spin" />
                        ) : noteSaved ? (
                          <CheckCircle2 size={13} strokeWidth={2} />
                        ) : (
                          <Save size={13} strokeWidth={2} />
                        )}
                        {savingNote ? 'Saving…' : noteSaved ? 'Saved!' : 'Save Note to Memory'}
                      </button>
                    </div>

                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </section>

      {/* ─── Name Prompt Overlay Dialog ─── */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg border border-divider max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-body font-bold text-navy">Enter Your Name</h3>
              <p className="text-caption text-subtle">
                Personalize the automatic takeover welcome message. Leave this blank to send a generic greeting from the team.
              </p>
            </div>
            
            <input
              type="text"
              value={agentNameInput}
              onChange={(e) => setAgentNameInput(e.target.value)}
              placeholder="Your Name (e.g. Amina)"
              className="w-full px-4 py-2.5 rounded-input border border-divider bg-white text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent text-body-sm transition-all duration-150"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmTakeover()
                } else if (e.key === 'Escape') {
                  setShowNamePrompt(false)
                }
              }}
            />
            
            <div className="flex items-center justify-end gap-2 text-caption">
              <button
                onClick={() => setShowNamePrompt(false)}
                className="px-4 py-2 rounded-button border border-divider text-subtle hover:bg-beige transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmTakeover}
                disabled={takeoverLoading}
                className="px-4 py-2 rounded-button bg-action hover:bg-action-hover text-white font-semibold transition-colors flex items-center gap-1.5"
              >
                {takeoverLoading ? <LoadingSpinner size="sm" /> : 'Confirm Takeover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <ConversationsView />
    </Suspense>
  )
}
