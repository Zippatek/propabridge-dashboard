'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, MessageSquare, Phone, Mail, User, Search } from 'lucide-react'
import type {
  SessionListItem,
  ConversationDetail,
  TranscriptTurn,
} from '@/lib/types'
import { adk } from '@/lib/client-api'
import { formatRelativeTime, formatDateTime, scoreClass } from '@/lib/format'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageError } from '@/components/admin/AsyncBoundary'

function useSessionStream() {
  const [items, setItems] = useState<SessionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/admin/adk-stream/sessions/stream')
    es.addEventListener('sessions', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { items: SessionListItem[] }
        setItems(data.items || [])
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('error', () => {
      // EventSource auto-reconnects; only surface a hard close
      if (es.readyState === EventSource.CLOSED) setError('Stream disconnected')
    })
    return () => es.close()
  }, [])

  return { items, error }
}

function useConversationStream(sessionId: string | null) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDetail(null)
    setError(null)
    if (!sessionId) return
    const es = new EventSource(
      `/api/admin/adk-stream/conversations/${encodeURIComponent(sessionId)}/stream`,
    )
    es.addEventListener('update', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as {
          transcript: TranscriptTurn[]
          lead: ConversationDetail['lead']
        }
        setDetail({
          lead: data.lead,
          transcript: data.transcript || [],
          appointments: [],
        })
      } catch {
        /* ignore */
      }
    })
    es.addEventListener('error', () => {
      if (es.readyState === EventSource.CLOSED) setError('Stream disconnected')
    })
    return () => es.close()
  }, [sessionId])

  return { detail, error }
}

function ConversationsView() {
  const search = useSearchParams()
  const router = useRouter()
  const selectedId = search.get('id')
  const { items, error: listError } = useSessionStream()
  const { detail } = useConversationStream(selectedId)
  const [filter, setFilter] = useState('')
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [detail?.transcript.length])

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
            <header className="h-18 flex items-center justify-between px-6 border-b border-divider flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-navy truncate">
                  {detail?.lead.name || 'Guest User'}
                </h3>
                <p className="text-caption text-subtle truncate">ID: {selectedId}</p>
              </div>
              {detail?.lead.score != null && (
                <span
                  className={`text-caption font-bold px-2.5 py-1 rounded ${scoreClass(detail.lead.score)}`}
                >
                  Score {detail.lead.score}/100
                </span>
              )}
            </header>

            <div className="flex flex-1 min-h-0">
              <div className="flex-1 flex flex-col min-w-0">
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
                      return (
                        <div
                          key={i}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[80%]">
                            <div
                              className={`px-4 py-3 text-body-sm whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-navy text-white rounded-2xl rounded-tr-sm'
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

                {detail?.lead.phone && (
                  <form
                    onSubmit={onSend}
                    className="border-t border-divider p-4 bg-beige/20 flex-shrink-0"
                  >
                    {sendError && (
                      <p className="text-caption text-danger mb-2">{sendError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={sendBody}
                        onChange={(e) => setSendBody(e.target.value)}
                        placeholder={`WhatsApp ${detail.lead.phone} as Propa`}
                        disabled={sending}
                        className="flex-1 px-4 py-3 rounded-input border border-divider bg-white text-body-sm placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={sending || !sendBody.trim()}
                        className="bg-action hover:bg-action-hover text-white font-semibold px-5 py-3 rounded-button transition-all duration-150 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Send size={14} strokeWidth={2} />
                        Send
                      </button>
                    </div>
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
