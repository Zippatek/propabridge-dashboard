'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardCheck,
  Search,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  MapPin,
  Building2,
  FileSearch,
  Crosshair,
} from 'lucide-react'
import { be } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'
import { PageLoading, PageError } from '@/components/admin/AsyncBoundary'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { runGeoSanityChecks } from '@/lib/verification/geoChecks'
import type { ClientFinding } from '@/lib/verification/findings'
import { FootprintMapPreview } from '@/components/admin/FootprintMapPreview'
import { ManualVerificationPanel } from '@/components/admin/ManualVerificationPanel'

type ViewMode = 'queue' | 'manual'

interface VerificationItem {
  listing_id: string
  title: string
  city: string
  verification_status: string
  created_at: string
  agency_name: string
  verification_id: string | null
  cadastral_zone: string | null
  plot_number: string | null
  title_file_no: string | null
  asking_price_ngn: number | null
  open_blocks: number
  open_flags: number
}

interface Finding {
  id: string
  code: string
  message: string
  severity: 'block' | 'flag' | 'info'
  state: 'open' | 'resolved' | 'waived' | 'acknowledged'
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
}

interface VerificationDetail {
  listing: Record<string, unknown>
  verification: Record<string, unknown> | null
  findings: Finding[]
  documents: Record<string, unknown>[]
}

type StatusFilter = 'submitted' | 'in_review' | 'needs_info' | 'verified' | 'rejected'

const STATUS_TABS: { label: string; value: StatusFilter | 'pending'; color: string }[] = [
  { label: 'Pending', value: 'pending', color: 'text-action' },
  { label: 'Submitted', value: 'submitted', color: 'text-warning' },
  { label: 'In Review', value: 'in_review', color: 'text-[#9333ea]' },
  { label: 'Needs Info', value: 'needs_info', color: 'text-danger' },
  { label: 'Verified', value: 'verified', color: 'text-verified' },
  { label: 'Rejected', value: 'rejected', color: 'text-danger' },
]

export default function AdminVerificationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('queue')
  const [items, setItems] = useState<VerificationItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<StatusFilter | 'pending'>('pending')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<VerificationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [waiveNote, setWaiveNote] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [rechecking, setRechecking] = useState(false)

  const load = () => {
    setError(null)
    const statusParam = activeTab === 'pending' ? 'submitted,in_review,needs_info' : activeTab
    be
      .get<{ items: VerificationItem[] }>(`/admin/verifications?status=${encodeURIComponent(statusParam)}`)
      .then((d) => setItems(d.items || []))
      .catch((e) => setError((e as Error).message))
  }

  useEffect(() => { load() }, [activeTab])

  const loadDetail = async (listingId: string) => {
    setSelectedId(listingId)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const d = await be.get<VerificationDetail>(`/admin/verifications/${encodeURIComponent(listingId)}`)
      setDetail(d)
    } catch (err) {
      setDetailError((err as Error).message)
    } finally {
      setDetailLoading(false)
    }
  }

  const onResolveFinding = async (findingId: string, state: 'resolved' | 'waived' | 'acknowledged') => {
    if (state === 'waived' && !waiveNote.trim()) {
      alert('A note is required when waiving a finding.')
      return
    }
    setResolvingId(findingId)
    try {
      await be.send(`/admin/findings/${encodeURIComponent(findingId)}`, 'PATCH', {
        state,
        note: state === 'waived' ? waiveNote : undefined,
      })
      if (selectedId) await loadDetail(selectedId)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setResolvingId(null)
      setWaiveNote('')
    }
  }

  const onDecision = async (decision: 'verified' | 'rejected' | 'needs_info', reason?: string) => {
    if (!selectedId) return
    setDeciding(true)
    try {
      await be.send(`/admin/verifications/${encodeURIComponent(selectedId)}/decision`, 'POST', {
        decision,
        reason,
      })
      setSelectedId(null)
      setDetail(null)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setDeciding(false)
    }
  }

  const onRecheck = async () => {
    if (!selectedId) return
    setRechecking(true)
    try {
      await be.send(`/admin/verifications/${encodeURIComponent(selectedId)}/recheck`, 'POST')
      if (selectedId) await loadDetail(selectedId)
      load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setRechecking(false)
    }
  }

  if (error) return <PageError message={error} />
  if (!items) return <PageLoading />

  const filtered = items.filter((v) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      v.title?.toLowerCase().includes(s) ||
      v.agency_name?.toLowerCase().includes(s) ||
      v.city?.toLowerCase().includes(s)
    )
  })

  const pendingCount = items.filter((v) => ['submitted', 'in_review', 'needs_info'].includes(v.verification_status)).length
  const totalBlocks = items.reduce((s, v) => s + Number(v.open_blocks), 0)
  const totalFlags = items.reduce((s, v) => s + Number(v.open_flags), 0)

  const statusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-warning-light text-warning'
      case 'in_review': return 'bg-[#f3e8ff] text-[#9333ea]'
      case 'needs_info': return 'bg-danger-light text-danger'
      case 'verified': return 'bg-verified-light text-verified'
      case 'rejected': return 'bg-danger-light text-danger'
      default: return 'bg-beige text-subtle'
    }
  }

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'block': return 'bg-danger-light text-danger'
      case 'flag': return 'bg-warning-light text-warning'
      case 'info': return 'bg-beige text-subtle'
      default: return 'bg-beige text-subtle'
    }
  }

  const findingStateBadge = (st: string) => {
    switch (st) {
      case 'open': return 'bg-danger-light text-danger'
      case 'resolved': return 'bg-verified-light text-verified'
      case 'waived': return 'bg-warning-light text-warning'
      case 'acknowledged': return 'bg-beige text-subtle'
      default: return 'bg-beige text-subtle'
    }
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selectedId && detail) {
    const openBlocks = detail.findings.filter((f) => f.state === 'open' && f.severity === 'block')
    const openFlags = detail.findings.filter((f) => f.state === 'open' && f.severity === 'flag')
    const listing = detail.listing as Record<string, unknown> & { title?: string; city?: string; verification_status?: string; agency_name?: string }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedId(null); setDetail(null) }} className="p-2 rounded hover:bg-beige text-subtle hover:text-navy">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-h3 text-navy">{listing.title || 'Listing detail'}</h1>
            <p className="text-body-sm text-subtle mt-0.5">{listing.city} · {listing.verification_status}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={AlertTriangle} iconColor="#dc2626" iconBgColor="#fef2f2" value={String(openBlocks.length)} label="Open blocks" />
          <StatCard icon={Flag} iconColor="#f59e0b" iconBgColor="#fffbeb" value={String(openFlags.length)} label="Open flags" />
          <StatCard icon={CheckCircle2} iconColor="#16a34a" iconBgColor="#dcfce7" value={String(detail.findings.filter((f) => f.state !== 'open').length)} label="Resolved" />
          <StatCard icon={ClipboardCheck} iconColor="#2563eb" iconBgColor="#dbeafe" value={String(detail.findings.length)} label="Total findings" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onRecheck} isLoading={rechecking} variant="ghost" size="sm">
            <RefreshCw size={14} /> Re-run checks
          </Button>
          {openBlocks.length === 0 && (
            <Button onClick={() => onDecision('verified')} isLoading={deciding} size="sm">
              <CheckCircle2 size={14} /> Verify listing
            </Button>
          )}
          <Button onClick={() => { const r = prompt('Reason for requesting more info:'); if (r !== null) onDecision('needs_info', r) }} variant="ghost" size="sm">
            <Flag size={14} /> Needs info
          </Button>
          <Button onClick={() => { const r = prompt('Reason for rejection:'); if (r !== null) onDecision('rejected', r) }} variant="danger" size="sm">
            <XCircle size={14} /> Reject
          </Button>
        </div>

        {/* Findings */}
        <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-divider">
            <h2 className="text-h4 text-navy">Findings</h2>
          </div>
          {detail.findings.length === 0 ? (
            <div className="p-10 text-center text-body-sm text-subtle">No findings recorded.</div>
          ) : (
            <div className="divide-y divide-divider">
              {detail.findings.map((f) => (
                <div key={f.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold ${severityBadge(f.severity)}`}>
                          {f.severity}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-caption font-semibold ${findingStateBadge(f.state)}`}>
                          {f.state}
                        </span>
                        <span className="text-caption text-subtle">{f.code}</span>
                      </div>
                      <p className="text-body-sm text-navy mt-1.5">{f.message}</p>
                      {f.resolution_note && (
                        <p className="text-caption text-subtle mt-1">Note: {f.resolution_note}</p>
                      )}
                      <p className="text-caption text-placeholder mt-1">{formatDateTime(f.created_at)}</p>
                    </div>
                    {f.state === 'open' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => onResolveFinding(f.id, 'resolved')}
                          isLoading={resolvingId === f.id}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const note = prompt('Waiver note (required):')
                            if (note) { setWaiveNote(note); onResolveFinding(f.id, 'waived') }
                          }}
                          disabled={resolvingId === f.id}
                        >
                          Waive
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Automated checks */}
        <AutomatedChecksCard listing={detail.listing} />

        {/* Verification record */}
        {detail.verification && (
          <section className="bg-white rounded-card border border-divider shadow-card p-6">
            <h2 className="text-h4 text-navy mb-4">Verification record</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-body-sm">
              {Object.entries(detail.verification).map(([k, v]) => (
                k !== 'id' && v != null ? (
                  <div key={k}>
                    <p className="text-caption text-subtle uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                    <p className="text-navy font-medium mt-0.5">{String(v)}</p>
                  </div>
                ) : null
              ))}
            </div>
          </section>
        )}

        {detailError && <p className="text-caption text-danger">{detailError}</p>}
      </div>
    )
  }

  if (selectedId && detailLoading) return <PageLoading />

  // ── Automated checks helper components ───────────────────────────────────
  function AutomatedChecksCard({ listing }: { listing: Record<string, unknown> }) {
    const listingId = typeof listing.id === 'string' ? listing.id : null
    const lat = typeof listing.latitude === 'number' ? listing.latitude : null
    const lng = typeof listing.longitude === 'number' ? listing.longitude : null
    const polygon = typeof listing.polygon_geojson === 'string' ? listing.polygon_geojson : null
    const propertyType = typeof listing.property_type === 'string' ? listing.property_type : null
    const cacRc = typeof listing.cac_rc_number === 'string' ? listing.cac_rc_number : null

    interface FootprintResult {
      available: boolean
      buildings_inside_count: number
      total_footprint_area_m2: number
      polygon_area_m2: number | null
      coverage_ratio: number | null
      findings: ClientFinding[]
      listing_polygon?: { type: 'Polygon'; coordinates: number[][][] } | null
      building_footprints?: { type: 'FeatureCollection'; features: GeoJSON.Feature[] }
    }
    const [footprintResult, setFootprintResult] = useState<FootprintResult | null>(null)
    const [footprintLoading, setFootprintLoading] = useState(false)
    const [footprintErr, setFootprintErr] = useState<string | null>(null)

    const runFootprintCheck = async () => {
      if (!listingId) return
      setFootprintLoading(true)
      setFootprintErr(null)
      try {
        const data = await be.get<FootprintResult>(
          `/listings/${listingId}/footprint-check?include_geometries=true`
        )
        setFootprintResult(data)
      } catch (e) {
        const msg = (e as Error).message || 'Footprint check failed'
        if (msg.includes('not yet loaded') || msg.includes('503')) {
          setFootprintErr('dataset_pending')
        } else {
          setFootprintErr(msg)
        }
      } finally {
        setFootprintLoading(false)
      }
    }

    const geoFindings: ClientFinding[] = runGeoSanityChecks({
      latitude: lat,
      longitude: lng,
      polygon_geojson: polygon,
      property_type: propertyType,
    })

    const allFindings = [
      ...geoFindings,
      ...(footprintResult?.findings ?? []),
    ]
    const passCount = allFindings.filter(f => f.state === 'pass').length
    const failCount = allFindings.filter(f => f.state === 'fail').length
    const hasCoords = lat != null && lng != null

    return (
      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-divider flex items-center gap-2">
          <ShieldCheck size={16} className="text-action" />
          <h2 className="text-h4 text-navy">Automated Checks</h2>
          <span className="ml-auto text-caption text-subtle">
            {passCount} pass · {failCount} fail
          </span>
        </div>
        <div className="divide-y divide-divider">

          {/* Geo sanity */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin size={13} className="text-subtle" />
              <span className="text-body-sm font-semibold text-navy">Geo Sanity</span>
              {!hasCoords && (
                <span className="ml-2 text-caption text-placeholder">No coordinates on listing</span>
              )}
            </div>
            {geoFindings.length === 0 ? (
              <p className="text-caption text-subtle">No geo data to check.</p>
            ) : (
              <ul className="space-y-1.5">
                {geoFindings.map((f, i) => (
                  <AutoFindingRow key={i} f={f} />
                ))}
              </ul>
            )}
          </div>

          {/* Google Open Buildings footprint check */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Building2 size={13} className="text-subtle" />
              <span className="text-body-sm font-semibold text-navy">Building Footprint</span>
              <span className="ml-auto">
                <button
                  type="button"
                  onClick={runFootprintCheck}
                  disabled={footprintLoading || !listingId}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-caption font-semibold bg-beige border border-divider text-subtle hover:text-action hover:border-action transition-colors disabled:opacity-50"
                >
                  {footprintLoading ? (
                    <><RefreshCw size={10} className="animate-spin" /> Checking…</>
                  ) : (
                    <><Building2 size={10} /> Run check</>
                  )}
                </button>
              </span>
            </div>
            {footprintErr === 'dataset_pending' ? (
              <p className="text-caption text-subtle leading-relaxed">
                The Google Open Buildings v3 dataset for FCT is not yet loaded into the database.
                Run <code className="text-[11px] bg-beige px-1 rounded">python scripts/export_open_buildings.py</code>{' '}
                then <code className="text-[11px] bg-beige px-1 rounded">bash scripts/load_footprints.sh</code> to populate it.
              </p>
            ) : footprintErr ? (
              <p className="text-caption text-danger">{footprintErr}</p>
            ) : footprintResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <p className="text-placeholder">Buildings inside</p>
                    <p className="font-semibold text-navy">{footprintResult.buildings_inside_count}</p>
                  </div>
                  <div>
                    <p className="text-placeholder">Footprint area</p>
                    <p className="font-semibold text-navy">{footprintResult.total_footprint_area_m2.toFixed(0)} m²</p>
                  </div>
                  <div>
                    <p className="text-placeholder">Coverage</p>
                    <p className="font-semibold text-navy">
                      {footprintResult.coverage_ratio != null
                        ? `${(footprintResult.coverage_ratio * 100).toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {footprintResult.findings.map((f, i) => (
                    <AutoFindingRow key={i} f={f} />
                  ))}
                </ul>
                <FootprintMapPreview
                  listingPolygon={footprintResult.listing_polygon ?? null}
                  buildingFootprints={footprintResult.building_footprints ?? null}
                  latitude={lat}
                  longitude={lng}
                />
              </div>
            ) : (
              <p className="text-caption text-subtle">
                Click <strong>Run check</strong> to cross-check the drawn polygon against Google Open Buildings v3 footprints for Abuja.
              </p>
            )}
          </div>

          {/* CAC quick-verify */}
          {cacRc && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-1.5 mb-2">
                <FileSearch size={13} className="text-subtle" />
                <span className="text-body-sm font-semibold text-navy">CAC Registration</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-caption text-subtle">RC #{cacRc}</p>
                <a
                  href="https://search.cac.gov.ng/home"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-caption font-semibold bg-beige border border-divider text-navy hover:text-action hover:border-action transition-colors"
                >
                  <FileSearch size={11} /> Verify on CAC
                </a>
                <span className="text-[10px] text-placeholder">Search for RC #{cacRc}</span>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  function AutoFindingRow({ f }: { f: ClientFinding }) {
    const icon = f.state === 'pass'
      ? <CheckCircle2 size={13} className="text-verified flex-shrink-0 mt-0.5" />
      : f.severity === 'block'
        ? <XCircle size={13} className="text-danger flex-shrink-0 mt-0.5" />
        : <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
    return (
      <li className="flex items-start gap-2">
        {icon}
        <span className="text-body-sm text-navy">{f.message}</span>
      </li>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Top-level mode toggle ────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-h3 text-navy">Verification</h1>
          <p className="text-body-sm text-subtle mt-1">Review listings or run ad-hoc checks</p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-divider shadow-sm">
          <button
            onClick={() => setViewMode('queue')}
            className={`px-4 py-2 text-body-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              viewMode === 'queue'
                ? 'bg-action text-white'
                : 'bg-white text-subtle hover:bg-beige hover:text-navy'
            }`}
          >
            <ClipboardCheck size={14} />
            Queue
          </button>
          <button
            onClick={() => setViewMode('manual')}
            className={`px-4 py-2 text-body-sm font-semibold transition-all duration-150 flex items-center gap-2 border-l border-divider ${
              viewMode === 'manual'
                ? 'bg-action text-white'
                : 'bg-white text-subtle hover:bg-beige hover:text-navy'
            }`}
          >
            <Crosshair size={14} />
            Property Intelligence
          </button>
        </div>
      </div>

      {/* ── Manual verification mode ─────────────────────────────────────── */}
      {viewMode === 'manual' ? (
        <ManualVerificationPanel />
      ) : (
      /* ── Queue mode (existing content) ───────────────────────────────── */
      <>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardCheck} iconColor="#2563eb" iconBgColor="#dbeafe" value={String(items.length)} label="In queue" />
        <StatCard icon={AlertTriangle} iconColor="#dc2626" iconBgColor="#fef2f2" value={String(totalBlocks)} label="Open blocks" />
        <StatCard icon={Flag} iconColor="#f59e0b" iconBgColor="#fffbeb" value={String(totalFlags)} label="Open flags" />
        <StatCard icon={ShieldCheck} iconColor="#16a34a" iconBgColor="#dcfce7" value={String(pendingCount)} label="Awaiting review" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-divider overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-body-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.value
                ? `border-action text-navy`
                : 'border-transparent text-subtle hover:text-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder" strokeWidth={1.8} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, agency, or city..."
          className="w-full pl-8 pr-3 py-2.5 rounded-input border border-divider bg-white text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action"
        />
      </div>

      {/* Table */}
      <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-body-sm text-subtle">
            {search ? 'No verifications match your search.' : 'No listings in this queue.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-beige/50 text-caption font-semibold text-subtle uppercase tracking-wider">
                  <th className="px-6 py-3">Listing</th>
                  <th className="px-6 py-3">Agency</th>
                  <th className="px-6 py-3">City</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Blocks</th>
                  <th className="px-6 py-3">Flags</th>
                  <th className="px-6 py-3">Submitted</th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filtered.map((v) => (
                  <tr key={v.listing_id} className="hover:bg-beige/30 transition-colors cursor-pointer" onClick={() => loadDetail(v.listing_id)}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy text-body-sm">{v.title}</p>
                      <p className="text-caption text-subtle">{String(v.listing_id ?? '').substring(0, 8)}…</p>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-navy">{v.agency_name || '—'}</td>
                    <td className="px-6 py-4 text-body-sm text-navy">{v.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-caption font-semibold ${statusBadge(v.verification_status)}`}>
                        {v.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Number(v.open_blocks) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-danger">
                          <AlertTriangle size={14} /> {v.open_blocks}
                        </span>
                      ) : (
                        <span className="text-body-sm text-verified">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {Number(v.open_flags) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-warning">
                          <Flag size={14} /> {v.open_flags}
                        </span>
                      ) : (
                        <span className="text-body-sm text-verified">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-caption text-subtle">{formatDateTime(v.created_at)}</td>
                    <td className="px-6 py-4">
                      <ChevronRight size={16} className="text-placeholder" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>)}
    </div>
  )
}
