'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, Loader2, RefreshCw, ExternalLink, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { be } from '@/lib/client-api'
import { PageError } from '@/components/admin/AsyncBoundary'

interface Issue {
  field: string
  severity: 'low' | 'medium' | 'high'
  message: string
  suggestion?: string
  source?: string
}
interface AuditRow {
  id: string
  property_id: string
  property_title?: string | null
  issues: Issue[]
  severity: 'high' | 'medium' | 'low' | 'none' | null
  created_at: string
}

const SEV_COLOR: Record<string, string> = {
  high: 'bg-danger-light text-danger border-danger/20',
  medium: 'bg-orange-50 text-orange-700 border-orange-200',
  low: 'bg-beige text-subtle border-divider',
}
const SEV_ICON = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Info,
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const load = useCallback(async (sev: string) => {
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (sev !== 'all') params.set('severity', sev)
      const data = await be.get<{ items: AuditRow[] }>(`/admin/property-audit/results?${params}`)
      setRows(data.items || [])
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => { load(severityFilter) }, [load, severityFilter])

  const runNow = async () => {
    setRunning(true); setRunMsg(null); setError(null)
    try {
      const res = await be.send<{ scanned: number; flagged: number; persisted: number }>(
        '/admin/property-audit/dispatch', 'POST', {},
      )
      setRunMsg(`Scanned ${res.scanned} · flagged ${res.flagged} · saved ${res.persisted}`)
      await load(severityFilter)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  if (error) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <ShieldAlert size={22} className="text-action" /> Data-Quality Audit
          </h1>
          <p className="text-body-sm text-subtle mt-0.5">
            Rule-based + AI checks. {rows ? `${rows.length} flagged record${rows.length === 1 ? '' : 's'}` : '…'}
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2.5 bg-action hover:bg-action-hover text-white text-body-sm font-semibold rounded-button disabled:opacity-50 shadow-sm"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {running ? 'Auditing…' : 'Run audit now'}
        </button>
      </div>

      {runMsg && (
        <div className="bg-action-light border border-action/20 text-action text-body-sm rounded-card px-4 py-2.5">
          {runMsg}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {['all', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-1.5 rounded-badge text-caption font-semibold capitalize transition-all duration-150 ${
              severityFilter === s
                ? 'bg-action text-white'
                : 'bg-white border border-divider text-subtle hover:text-navy hover:bg-beige'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {!rows ? (
        <div className="text-subtle text-body-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-card border border-divider shadow-card p-16 text-center text-subtle">
          <ShieldAlert size={40} strokeWidth={1.2} className="mx-auto text-divider mb-3" />
          <p className="text-body-sm">No findings recorded yet. Click <strong>Run audit now</strong> to scan listings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-white rounded-card border border-divider shadow-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-navy line-clamp-1">
                    {r.property_title || '(deleted property)'}
                  </p>
                  <p className="text-caption text-subtle mt-0.5">
                    id <code className="text-[11px] bg-beige px-1 rounded">{r.property_id}</code>
                    {' · '}{new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.severity && r.severity !== 'none' && (
                    <span className={`px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase border ${SEV_COLOR[r.severity] || SEV_COLOR.low}`}>
                      {r.severity}
                    </span>
                  )}
                  <Link
                    href={`/admin/listings?focus=${r.property_id}`}
                    className="flex items-center gap-1 text-caption text-action hover:underline"
                  >
                    Open <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
              <ul className="space-y-1.5">
                {r.issues.map((issue, idx) => {
                  const Icon = SEV_ICON[issue.severity] || Info
                  return (
                    <li key={idx} className="flex items-start gap-2 text-body-sm">
                      <Icon
                        size={14}
                        className={`mt-0.5 flex-shrink-0 ${
                          issue.severity === 'high' ? 'text-danger' :
                          issue.severity === 'medium' ? 'text-orange-600' : 'text-subtle'
                        }`}
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-navy">{issue.field}</span>
                        <span className="text-subtle"> — {issue.message}</span>
                        {issue.suggestion && (
                          <span className="block text-caption text-action mt-0.5">→ {issue.suggestion}</span>
                        )}
                        {issue.source === 'ai' && (
                          <span className="ml-2 text-[10px] uppercase text-placeholder font-semibold">ai</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
