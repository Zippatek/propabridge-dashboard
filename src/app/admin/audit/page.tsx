'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  Wand2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { PageError } from '@/components/admin/AsyncBoundary'

interface Issue {
  field: string
  severity: 'low' | 'medium' | 'high'
  message: string
  suggestion?: string
  source?: string
  issueType?: string
}
interface AuditRow {
  id: string
  property_id: string
  property_title?: string | null
  issues: Issue[]
  severity: 'high' | 'medium' | 'low' | 'none' | null
  created_at: string
  fix_log?: unknown
  /** Analyst hint from gateway (pricing semantics); optional */
  pricing_hint?: string | null
}

interface AutofixPreviewPayload {
  propertyId: string
  auditRowId: string
  issueIds: string[] | null
  proposed: Record<string, unknown>
  before: Record<string, unknown>
  patchedFields: string[]
  skipped: { field: string; reason: string }[]
  anthropicUnavailable?: { message: string; providerDetail?: string }
  user_context?: string
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

/** Fields the backend auto-fix whitelist allows */
const ANTHROPIC_PLANS_URL = 'https://console.anthropic.com/settings/plans'

const AUTOFIXABLE_FIELDS = new Set([
  'city',
  'property_type',
  'listing_type',
  'description',
  'summary',
  'search_keywords',
  'slug',
  'neighborhood',
])

interface AutofixApiResponse {
  proposed?: Record<string, unknown>
  before?: Record<string, unknown>
  patchedFields?: string[]
  skipped?: { field: string; reason: string }[]
  dryRun?: boolean
  applied?: boolean
  error?: string
  message?: string
  provider_detail?: unknown
  note?: string
}

async function postPropertyAutofix(
  body: Record<string, unknown> & { user_context?: string },
): Promise<{ status: number; data: AutofixApiResponse }> {
  const res = await fetch(`/api/admin/be/admin/property-audit/autofix`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as AutofixApiResponse
  const recoverable =
    data.error === 'anthropic_unavailable' && (res.status === 200 || res.status === 422)
  if (!res.ok && !recoverable) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : `Request failed (${res.status})`
    throw new Error(msg)
  }
  return { status: res.status, data }
}

function formatFieldValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.join(', ') || '—'
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length > 800 ? `${s.slice(0, 800)}…` : s
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runMsg, setRunMsg] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [autofixLoading, setAutofixLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<AutofixPreviewPayload | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [billingBanner, setBillingBanner] = useState<string | null>(null)
  const [autofixContextModal, setAutofixContextModal] = useState('')
  const [flaggedTotal, setFlaggedTotal] = useState<number | null>(null)
  const [expandedPid, setExpandedPid] = useState<string | null>(null)
  /** Optional operator notes passed to Gemini autofix (per property id) */
  const [fixContextByProperty, setFixContextByProperty] = useState<Record<string, string>>({})
  const [listingEdit, setListingEdit] = useState<
    Record<
      string,
      {
        price: string
        listing_type: string
        size_sqm: string
        intent: string
        loaded: boolean
        saving: boolean
      }
    >
  >({})

  const load = useCallback(async (sev: string) => {
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (sev !== 'all') params.set('severity', sev)
      const data = await be.get<{ items: AuditRow[]; flagged_total?: number }>(
        `/admin/property-audit/results?${params}`,
      )
      setRows(data.items || [])
      if (typeof data.flagged_total === 'number') setFlaggedTotal(data.flagged_total)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => { load(severityFilter) }, [load, severityFilter])

  useEffect(() => {
    if (preview) setAutofixContextModal(preview.user_context || '')
  }, [preview])

  function issueRef(auditRowId: string, index: number) {
    return `${auditRowId}:${index}`
  }

  const normalizeListingTypeUi = (raw: string | null | undefined): string => {
    const s = String(raw || '').toLowerCase()
    if (s.includes('rent')) return 'rent'
    return 'sale'
  }

  const ensureListingEdit = async (pid: string) => {
    if (listingEdit[pid]?.loaded) return
    setListingEdit(prev => ({
      ...prev,
      [pid]: {
        price: '',
        listing_type: 'sale',
        size_sqm: '',
        intent: '',
        loaded: false,
        saving: false,
      },
    }))
    try {
      const json = await be.get<{
        success?: boolean
        data?: {
          price?: number | null
          listing_type?: string | null
          size_sqm?: number | string | null
          intent?: string | null
        }
      }>(`/listings/${encodeURIComponent(pid)}`)
      const row =
        json.data ??
        (json as unknown as {
          price?: number | null
          listing_type?: string | null
          size_sqm?: number | string | null
          intent?: string | null
        })
      const r = row as {
        price?: number | null
        listing_type?: string | null
        size_sqm?: number | string | null
        intent?: string | null
      }
      setListingEdit(prev => ({
        ...prev,
        [pid]: {
          price: r.price != null ? String(r.price) : '',
          listing_type: normalizeListingTypeUi(r.listing_type),
          size_sqm: r.size_sqm != null ? String(r.size_sqm) : '',
          intent: r.intent != null ? String(r.intent) : '',
          loaded: true,
          saving: false,
        },
      }))
    } catch {
      setListingEdit(prev => ({
        ...prev,
        [pid]: {
          price: '',
          listing_type: 'sale',
          size_sqm: '',
          intent: '',
          loaded: true,
          saving: false,
        },
      }))
    }
  }

  const toggleExpand = (pid: string) => {
    if (expandedPid === pid) {
      setExpandedPid(null)
      return
    }
    setExpandedPid(pid)
    void ensureListingEdit(pid)
  }

  const saveListingPatch = async (pid: string) => {
    const ed = listingEdit[pid]
    if (!ed) return
    setListingEdit(prev => ({ ...prev, [pid]: { ...ed, saving: true } }))
    setNotice(null)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      if (ed.price.trim()) {
        const n = Number(ed.price)
        if (!Number.isFinite(n)) throw new Error('Price must be a number')
        payload.price = n
      }
      if (ed.listing_type) payload.listing_type = ed.listing_type
      if (ed.size_sqm.trim()) {
        const n = Number(ed.size_sqm)
        if (!Number.isFinite(n)) throw new Error('Size must be a number')
        payload.size_sqm = n
      }
      if (ed.intent.trim()) payload.intent = ed.intent.trim()
      if (Object.keys(payload).length === 0) {
        setNotice('No field changes to save.')
        return
      }
      await be.send(`/listings/${encodeURIComponent(pid)}`, 'PATCH', payload)
      setNotice('Listing saved. Audit list refreshed.')
      await load(severityFilter)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setListingEdit(prev => {
        const cur = prev[pid]
        if (!cur) return prev
        return { ...prev, [pid]: { ...cur, saving: false } }
      })
    }
  }

  const dryRunAutofix = async (
    propertyId: string,
    auditRowId: string,
    issueIds: string[] | null,
  ) => {
    const loadKey = `${propertyId}:${issueIds?.join(',') ?? 'all'}`
    setAutofixLoading(loadKey)
    setNotice(null)
    setBillingBanner(null)
    setError(null)
    const uc = (fixContextByProperty[propertyId] || '').trim()
    try {
      const { data } = await postPropertyAutofix({
        propertyId,
        issueIds: issueIds ?? undefined,
        dryRun: true,
        ...(uc ? { user_context: uc } : {}),
      })
      const detail =
        data.provider_detail !== undefined && data.provider_detail !== null
          ? typeof data.provider_detail === 'string'
            ? data.provider_detail
            : JSON.stringify(data.provider_detail)
          : undefined
      setPreview({
        propertyId,
        auditRowId,
        issueIds,
        proposed: data.proposed || {},
        before: data.before || {},
        patchedFields: data.patchedFields || [],
        skipped: data.skipped || [],
        user_context: uc || undefined,
        anthropicUnavailable:
          data.error === 'anthropic_unavailable'
            ? { message: data.message || 'Anthropic is unavailable.', providerDetail: detail }
            : undefined,
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAutofixLoading(null)
    }
  }

  const applyAutofix = async () => {
    if (!preview) return
    setApplyLoading(true)
    setNotice(null)
    setBillingBanner(null)
    setError(null)
    try {
      const uc = autofixContextModal.trim()
      const { data } = await postPropertyAutofix({
        propertyId: preview.propertyId,
        issueIds: preview.issueIds ?? undefined,
        dryRun: false,
        ...(uc ? { user_context: uc } : {}),
      })
      setPreview(null)
      setNotice(
        data.applied
          ? `Applied updates: ${(data.patchedFields || []).join(', ') || 'none'}.`
          : 'No changes applied.',
      )
      if (data.error === 'anthropic_unavailable') {
        setBillingBanner(data.message || 'Anthropic is unavailable; only rule-based fixes were applied.')
      }
      await load(severityFilter)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setApplyLoading(false)
    }
  }

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

  if (error && !rows) return <PageError message={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h3 text-navy flex items-center gap-2">
            <ShieldAlert size={22} className="text-action" /> Data-Quality Audit
          </h1>
          <p className="text-body-sm text-subtle mt-0.5">
            Rule-based + AI checks.{' '}
            {rows
              ? (() => {
                  const n = flaggedTotal ?? rows.length
                  return `${n} flagged record${n === 1 ? '' : 's'}`
                })()
              : '…'}
            {rows && flaggedTotal != null && rows.length < flaggedTotal ? (
              <span className="text-caption"> (showing latest {rows.length})</span>
            ) : null}
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
      {notice && (
        <div className="bg-action-light border border-action/20 text-action text-body-sm rounded-card px-4 py-2.5">
          {notice}
        </div>
      )}
      {billingBanner && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 text-body-sm rounded-card px-4 py-2.5 space-y-1">
          <p>{billingBanner}</p>
          <a
            href={ANTHROPIC_PLANS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-action hover:underline"
          >
            Plans &amp; Billing (Anthropic) <ExternalLink size={12} />
          </a>
        </div>
      )}
      {error && (
        <div className="bg-danger-light border border-danger/20 text-danger text-body-sm rounded-card px-4 py-2.5">
          {error}
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
                <div className="min-w-0 flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(r.property_id)}
                    className="mt-0.5 p-0.5 text-subtle hover:text-navy rounded"
                    aria-expanded={expandedPid === r.property_id}
                    title={expandedPid === r.property_id ? 'Collapse' : 'Expand listing edits'}
                  >
                    {expandedPid === r.property_id ? (
                      <ChevronDown size={18} strokeWidth={2} />
                    ) : (
                      <ChevronRight size={18} strokeWidth={2} />
                    )}
                  </button>
                  <div>
                  <p className="text-body-sm font-semibold text-navy line-clamp-1">
                    {r.property_title || '(deleted property)'}
                  </p>
                  <p className="text-caption text-subtle mt-0.5">
                    id <code className="text-[11px] bg-beige px-1 rounded">{r.property_id}</code>
                    {' · '}{new Date(r.created_at).toLocaleString()}
                  </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.severity && r.severity !== 'none' && (
                    <span className={`px-2 py-0.5 rounded-badge text-[10px] font-bold uppercase border ${SEV_COLOR[r.severity] || SEV_COLOR.low}`}>
                      {r.severity}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!!autofixLoading}
                    onClick={() => dryRunAutofix(r.property_id, r.id, null)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-badge text-caption font-semibold bg-beige border border-divider text-navy hover:bg-action-light hover:border-action/30 disabled:opacity-50"
                  >
                    {autofixLoading === `${r.property_id}:all` ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    Auto-fix all (in scope)
                  </button>
                  <Link
                    href={`/admin/listings/${r.property_id}/edit`}
                    className="flex items-center gap-1 text-caption text-action hover:underline"
                  >
                    Edit <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
              {r.pricing_hint ? (
                <p className="text-caption text-subtle mb-2 pl-7 border-l-2 border-action/30">
                  <span className="font-semibold text-navy">Pricing model hint:</span> {r.pricing_hint}
                </p>
              ) : null}
              {expandedPid === r.property_id && (
                <div className="mb-4 pl-7 space-y-3 pt-1 border-t border-divider/80">
                  <div>
                    <label className="text-caption font-semibold text-subtle uppercase tracking-wide">Fix context (optional)</label>
                    <p className="text-[11px] text-placeholder mb-1">
                      Passed to AI auto-fix as operator constraints only; does not override database facts.
                    </p>
                    <textarea
                      value={fixContextByProperty[r.property_id] ?? ''}
                      onChange={e =>
                        setFixContextByProperty(prev => ({
                          ...prev,
                          [r.property_id]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-input border border-divider text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
                      placeholder="e.g. Price is annual rent; title uses per-sqm developer rate…"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-body-sm">
                      <span className="text-caption text-subtle block mb-0.5">Price</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={listingEdit[r.property_id]?.price ?? ''}
                        onChange={e =>
                          setListingEdit(prev => ({
                            ...prev,
                            [r.property_id]: {
                              ...(prev[r.property_id] || {
                                price: '',
                                listing_type: 'sale',
                                size_sqm: '',
                                intent: '',
                                loaded: true,
                                saving: false,
                              }),
                              price: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                      />
                    </label>
                    <label className="text-body-sm">
                      <span className="text-caption text-subtle block mb-0.5">Listing type</span>
                      <select
                        value={listingEdit[r.property_id]?.listing_type ?? 'sale'}
                        onChange={e =>
                          setListingEdit(prev => ({
                            ...prev,
                            [r.property_id]: {
                              ...(prev[r.property_id] || {
                                price: '',
                                listing_type: 'sale',
                                size_sqm: '',
                                intent: '',
                                loaded: true,
                                saving: false,
                              }),
                              listing_type: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-input border border-divider text-body-sm bg-white"
                      >
                        <option value="sale">Sale</option>
                        <option value="rent">Rent</option>
                      </select>
                    </label>
                    <label className="text-body-sm">
                      <span className="text-caption text-subtle block mb-0.5">Size (m²)</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={listingEdit[r.property_id]?.size_sqm ?? ''}
                        onChange={e =>
                          setListingEdit(prev => ({
                            ...prev,
                            [r.property_id]: {
                              ...(prev[r.property_id] || {
                                price: '',
                                listing_type: 'sale',
                                size_sqm: '',
                                intent: '',
                                loaded: true,
                                saving: false,
                              }),
                              size_sqm: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                      />
                    </label>
                    <label className="text-body-sm">
                      <span className="text-caption text-subtle block mb-0.5">Intent</span>
                      <input
                        type="text"
                        value={listingEdit[r.property_id]?.intent ?? ''}
                        onChange={e =>
                          setListingEdit(prev => ({
                            ...prev,
                            [r.property_id]: {
                              ...(prev[r.property_id] || {
                                price: '',
                                listing_type: 'sale',
                                size_sqm: '',
                                intent: '',
                                loaded: true,
                                saving: false,
                              }),
                              intent: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-input border border-divider text-body-sm"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={listingEdit[r.property_id]?.saving}
                      onClick={() => saveListingPatch(r.property_id)}
                      className="px-4 py-2 rounded-button bg-navy text-white text-body-sm font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      {listingEdit[r.property_id]?.saving ? (
                        <Loader2 size={14} className="animate-spin inline" />
                      ) : null}{' '}
                      Save listing fields
                    </button>
                  </div>
                </div>
              )}
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
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-navy">{issue.field}</span>
                          {issue.issueType === 'informational_price_per_sqm' && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-beige text-subtle border border-divider">
                              per-sqm info
                            </span>
                          )}
                          {AUTOFIXABLE_FIELDS.has(issue.field) && (
                            <button
                              type="button"
                              disabled={!!autofixLoading}
                              onClick={() =>
                                dryRunAutofix(r.property_id, r.id, [issueRef(r.id, idx)])
                              }
                              className="text-[10px] font-semibold uppercase tracking-wide text-action hover:underline disabled:opacity-50"
                            >
                              {autofixLoading === `${r.property_id}:${issueRef(r.id, idx)}` ? (
                                <Loader2 size={10} className="inline animate-spin" />
                              ) : null}{' '}
                              Auto-fix this
                            </button>
                          )}
                        </div>
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

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-[2px]"
          role="dialog"
          aria-modal
          aria-labelledby="autofix-preview-title"
        >
          <div className="bg-white rounded-card border border-divider shadow-card max-w-2xl w-full max-h-[min(90vh,800px)] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-divider flex items-start justify-between gap-3">
              <div>
                <h2 id="autofix-preview-title" className="text-body font-semibold text-navy">
                  {preview.anthropicUnavailable ? 'Review suggested fixes' : 'Review AI suggestions'}
                </h2>
                <p className="text-caption text-subtle mt-0.5">
                  Property <code className="text-[11px] bg-beige px-1 rounded">{preview.propertyId}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-subtle hover:text-navy text-caption font-semibold px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
              {preview.anthropicUnavailable && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-body-sm text-orange-950 space-y-1.5">
                  <p className="font-semibold text-navy">AI suggestions unavailable</p>
                  <p>{preview.anthropicUnavailable.message}</p>
                  {preview.anthropicUnavailable.providerDetail && (
                    <p className="text-caption text-subtle break-words">
                      {preview.anthropicUnavailable.providerDetail}
                    </p>
                  )}
                  <a
                    href={ANTHROPIC_PLANS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-action hover:underline"
                  >
                    Plans &amp; Billing (Anthropic) <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {preview.patchedFields.length === 0 && (
                <p className="text-body-sm text-subtle">
                  No field changes proposed. You can still review skipped items below.
                </p>
              )}
              {preview.patchedFields.length > 0 && (
                <table className="w-full text-body-sm border border-divider rounded-lg overflow-hidden">
                  <thead className="bg-beige text-caption text-left text-subtle">
                    <tr>
                      <th className="p-2 font-semibold">Field</th>
                      <th className="p-2 font-semibold">Before</th>
                      <th className="p-2 font-semibold">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.patchedFields.map(key => (
                      <tr key={key} className="border-t border-divider align-top">
                        <td className="p-2 font-semibold text-navy whitespace-nowrap">{key}</td>
                        <td className="p-2 text-subtle break-words max-w-[min(200px,40vw)]">
                          {formatFieldValue(preview.before[key])}
                        </td>
                        <td className="p-2 text-navy break-words max-w-[min(200px,40vw)]">
                          {formatFieldValue(preview.proposed[key])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {preview.skipped.length > 0 && (
                <div>
                  <p className="text-caption font-semibold text-subtle uppercase tracking-wide mb-1.5">Skipped</p>
                  <ul className="list-disc list-inside text-body-sm text-subtle space-y-0.5">
                    {preview.skipped.map(s => (
                      <li key={`${s.field}-${s.reason}`}>
                        <span className="font-medium text-navy">{s.field}</span>: {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="text-caption font-semibold text-subtle uppercase tracking-wide">Fix context for apply</label>
                <textarea
                  value={autofixContextModal}
                  onChange={e => setAutofixContextModal(e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-input border border-divider text-body-sm"
                  placeholder="Operator notes sent with Apply (same as row expand)"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-divider flex flex-wrap justify-end gap-2 bg-beige/50">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-button border border-divider text-body-sm font-semibold text-subtle hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applyLoading || preview.patchedFields.length === 0}
                onClick={() => applyAutofix()}
                className="px-4 py-2 rounded-button bg-action text-white text-body-sm font-semibold hover:bg-action-hover disabled:opacity-50"
              >
                {applyLoading ? <Loader2 size={14} className="animate-spin inline" /> : null} Apply to listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
