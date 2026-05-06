'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Phone,
  Clock,
} from 'lucide-react'
import { adk } from '@/lib/client-api'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'

interface Promise {
  id: string
  created_at: string
  session_id: string
  lead_phone?: string | null
  lead_name?: string | null
  promise_text: string
  detected_keywords?: string[]
  is_explicit?: boolean
  status: 'open' | 'resolved'
  resolved_at?: string | null
  resolved_by?: string | null
  notes?: string | null
}

type Tab = 'open' | 'resolved'

export default function AdminPromisesPage() {
  const [promises, setPromises] = useState<Promise[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('open')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setPromises(null)
    adk
      .get<{ items: Promise[] }>(`/promises?status=${tab}`)
      .then((d) => setPromises(d.items || []))
      .catch((e) => setError((e as Error).message))
  }

  useEffect(() => { load() }, [tab])

  const resolve = async (id: string) => {
    setResolvingId(id)
    try {
      await adk.send(`/promises/${id}/resolve`, 'POST', { resolved_by: 'admin' })
      load()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setResolvingId(null)
    }
  }

  const open = (promises || []).filter((p) => p.status === 'open').length
  const resolved = (promises || []).filter((p) => p.status === 'resolved').length

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <AlertTriangle size={22} strokeWidth={1.8} className="text-danger" />
            AI Promises &amp; Escalations
          </h1>
          <p className="text-body-sm text-subtle mt-1">
            Commitments the AI made to leads that require human follow-through.
          </p>
        </div>
        {tab === 'open' && promises !== null && promises.length > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-danger/10 text-danger text-body-sm font-semibold px-3 py-1.5 rounded-badge border border-danger/20">
            <AlertTriangle size={14} strokeWidth={2} />
            {promises.length} requiring attention
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-beige rounded-lg p-1 w-fit border border-divider">
        {(['open', 'resolved'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-body-sm font-semibold transition-all duration-150 ${
              tab === t
                ? 'bg-white text-navy shadow-sm'
                : 'text-subtle hover:text-navy'
            }`}
          >
            {t === 'open' ? `Open${open ? ` (${open})` : ''}` : `Resolved${resolved ? ` (${resolved})` : ''}`}
          </button>
        ))}
      </div>

      {/* List */}
      {promises === null ? (
        <PageLoading />
      ) : promises.length === 0 ? (
        <div className="bg-white rounded-card border border-divider shadow-card p-16 text-center">
          <CheckCircle
            size={48}
            strokeWidth={1.2}
            className="mx-auto text-verified mb-3"
          />
          <p className="text-body-sm text-subtle">
            {tab === 'open'
              ? 'No open promises — all clear!'
              : 'No resolved promises yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up">
          {promises.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-card border shadow-card p-5 ${
                p.status === 'open'
                  ? 'border-danger/30'
                  : 'border-divider opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {p.lead_phone && (
                      <span className="flex items-center gap-1 text-caption text-subtle">
                        <Phone size={12} strokeWidth={1.8} />
                        {p.lead_phone}
                      </span>
                    )}
                    {p.lead_name && (
                      <span className="text-caption text-subtle">{p.lead_name}</span>
                    )}
                    <span className="flex items-center gap-1 text-caption text-subtle">
                      <Clock size={12} strokeWidth={1.8} />
                      {formatRelativeTime(p.created_at)}
                    </span>
                    {p.is_explicit && (
                      <span className="bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 rounded-badge border border-danger/20">
                        EXPLICIT PROMISE
                      </span>
                    )}
                  </div>

                  {/* Promise text */}
                  <p className="text-body-sm text-navy leading-relaxed line-clamp-3 mb-3">
                    &ldquo;{p.promise_text}&rdquo;
                  </p>

                  {/* Keywords */}
                  {p.detected_keywords && p.detected_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {p.detected_keywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-gold/10 text-gold text-[10px] font-semibold px-2 py-0.5 rounded border border-gold/20"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Resolved info */}
                  {p.status === 'resolved' && p.resolved_at && (
                    <p className="text-caption text-subtle">
                      Resolved {formatDateTime(p.resolved_at)}
                      {p.resolved_by ? ` by ${p.resolved_by}` : ''}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/conversations?id=${encodeURIComponent(p.session_id)}`}
                    className="flex items-center gap-1.5 text-body-sm font-semibold text-action hover:text-action-hover bg-action-light px-3 py-2 rounded-button"
                  >
                    <MessageSquare size={13} strokeWidth={2} />
                    Open chat
                  </Link>
                  {p.status === 'open' && (
                    <button
                      onClick={() => resolve(p.id)}
                      disabled={resolvingId === p.id}
                      className="flex items-center gap-1.5 text-body-sm font-semibold text-verified hover:opacity-80 bg-verified/10 border border-verified/20 px-3 py-2 rounded-button transition-all duration-150 disabled:opacity-50"
                    >
                      <CheckCircle size={13} strokeWidth={2} />
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
