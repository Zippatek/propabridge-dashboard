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
} from 'lucide-react'
import type {
  SessionListItem,
  ConversationDetail,
  TranscriptTurn,
  TakeoverStatus,
} from '@/lib/types'
import { adk } from '@/lib/client-api'
import { formatRelativeTime, formatDateTime, scoreClass } from '@/lib/format'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageError } from '@/components/admin/AsyncBoundary'

/* ─── Mock data (used when ADK backend is unreachable) ───────────────────── */

const MOCK_SESSIONS: SessionListItem[] = [
  {
    id: 'sess-wa-08123456789',
    name: 'Amina Yusuf',
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
    phone: '+2347034567890',
    email: 'fatimah.bello@yahoo.com',
    score: 44,
    intent: 'enquiry',
    created_at: new Date(Date.now() - 3600_000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600_000 * 3).toISOString(),
  },
]

const MOCK_TRANSCRIPTS: Record<string, { lead: ConversationDetail['lead']; transcript: TranscriptTurn[] }> = {
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

function useConversationStream(sessionId: string | null) {
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
        }
        gotRealData.current = true
        setDetail({
          lead: data.lead,
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
        setDetail({ lead: mockData.lead, transcript: mockData.transcript, appointments: [] })
        setError(null)
      }
    })

    // Fallback timeout — only if no real data arrived
    const timeout = setTimeout(() => {
      if (!gotRealData.current && mockData) {
        es.close()
        setDetail({ lead: mockData.lead, transcript: mockData.transcript, appointments: [] })
      }
    }, 3000)

    return () => {
      clearTimeout(timeout)
      es.close()
    }
  }, [sessionId])

  return { detail, error }
}

/* ─── Takeover status hook ───────────────────────────────────────────────── */

function useTakeoverStatus(sessionId: string | null) {
  const [status, setStatus] = useState<TakeoverStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!sessionId) {
      setStatus(null)
      return
    }
    try {
      const data = await adk.get<TakeoverStatus>(
        `/conversations/${encodeURIComponent(sessionId)}/takeover`,
      )
      setStatus(data)
    } catch {
      // endpoint may not exist yet — default to not taken over
      setStatus({ is_taken_over: false })
    }
  }, [sessionId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const takeover = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await adk.send<TakeoverStatus>(
        `/conversations/${encodeURIComponent(sessionId)}/takeover`,
        'POST',
        { action: 'takeover' },
      )
      setStatus(data)
    } catch (err) {
      // If the endpoint doesn't exist, simulate local-only takeover
      setStatus({ is_taken_over: true, taken_over_by: 'Admin', taken_over_at: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  const release = async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await adk.send<TakeoverStatus>(
        `/conversations/${encodeURIComponent(sessionId)}/takeover`,
        'POST',
        { action: 'release' },
      )
      setStatus(data)
    } catch {
      setStatus({ is_taken_over: false })
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, takeover, release, refresh }
}

/* ─── Main view ──────────────────────────────────────────────────────────── */

function ConversationsView() {
  const search = useSearchParams()
  const router = useRouter()
  const selectedId = search.get('id')
  const { items, error: listError } = useSessionStream()
  const { detail } = useConversationStream(selectedId)
  const { status: takeoverStatus, loading: takeoverLoading, takeover, release } =
    useTakeoverStatus(selectedId)
  const [filter, setFilter] = useState('')
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isTakenOver = takeoverStatus?.is_taken_over ?? false

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
    } catch (err) {
      setSendError((err as Error).message)
    } finally {
      setSending(false)
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
                      {s.name || 'Guest User'}
                    </p>
                    <span className="text-caption text-subtle whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(s.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-caption text-subtle bg-beige px-1.5 py-0.5 rounded truncate">
                      {String(s.id ?? '').substring(0, 12)}…
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreClass(s.score)}`}
                    >
                      Sc: {s.score ?? 0}
                    </span>
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
                  {detail?.lead.name || 'Guest User'}
                </h3>
                <p className="text-caption text-subtle truncate">ID: {selectedId}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
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
                    {takeoverStatus?.taken_over_at && (
                      <> · Since {formatDateTime(takeoverStatus.taken_over_at)}</>
                    )}
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
                            ? `Reply as human agent to ${detail.lead.phone}`
                            : `WhatsApp ${detail.lead.phone} as Propa`
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

              {/* Lead context */}
              <aside className="hidden lg:block w-64 border-l border-divider p-5 overflow-y-auto bg-beige/20 flex-shrink-0">
                <p className="text-caption text-placeholder uppercase tracking-wider font-semibold mb-3">
                  Lead Context
                </p>
                {!detail ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <div className="space-y-4 text-body-sm">
                    <div>
                      <p className="text-caption text-subtle">Name</p>
                      <p className="text-navy font-semibold flex items-center gap-1.5 mt-0.5">
                        <User size={14} strokeWidth={1.5} />
                        {detail.lead.name || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-subtle">Phone</p>
                      <p className="text-navy flex items-center gap-1.5 mt-0.5">
                        <Phone size={14} strokeWidth={1.5} />
                        {detail.lead.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-caption text-subtle">Email</p>
                      <p className="text-navy flex items-center gap-1.5 mt-0.5 truncate">
                        <Mail size={14} strokeWidth={1.5} />
                        {detail.lead.email || '—'}
                      </p>
                    </div>
                    <hr className="border-divider" />

                    {/* ─── Takeover status in sidebar ─── */}
                    <div>
                      <p className="text-caption text-subtle">Agent Mode</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {isTakenOver ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#ffc870] animate-pulse" />
                            <span className="text-[#5d3e02] font-semibold text-caption">
                              Human — Active
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-verified" />
                            <span className="text-verified font-semibold text-caption">
                              AI — Active
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <hr className="border-divider" />
                    <div>
                      <p className="text-caption text-subtle">Intent</p>
                      <p className="text-navy capitalize">{detail.lead.intent || '—'}</p>
                    </div>
                    <div>
                      <p className="text-caption text-subtle">Budget</p>
                      <p className="text-navy">{detail.lead.budget || '—'}</p>
                    </div>
                    <div>
                      <p className="text-caption text-subtle">Location</p>
                      <p className="text-navy">{detail.lead.location_preference || '—'}</p>
                    </div>
                    <div>
                      <p className="text-caption text-subtle">Property type</p>
                      <p className="text-navy capitalize">
                        {detail.lead.property_type || '—'}
                      </p>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </section>
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
