'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  ShieldCheck,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Crosshair,
  Layers,
  FileText,
  ChevronDown,
  Loader2,
  Copy,
  Eye,
} from 'lucide-react'
import { runGeoSanityChecks, parsePolygon, polygonAreaM2, polygonCentroid } from '@/lib/verification/geoChecks'
import type { ClientFinding } from '@/lib/verification/findings'
import { be } from '@/lib/client-api'

/* ───────────────────────── Types ──────────────────────────────────────────── */

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

const TITLE_TYPES = [
  ['', '— Select —'],
  ['c_of_o', 'Certificate of Occupancy (C of O)'],
  ['r_of_o', 'Right of Occupancy (R of O)'],
  ['governors_consent', "Governor's Consent"],
  ['deed_of_assignment', 'Deed of Assignment'],
  ['customary', 'Customary'],
  ['allocation_letter', 'Allocation Letter'],
] as const

const PROPERTY_TYPES = [
  ['', '— Any —'],
  ['apartment', 'Apartment'],
  ['house', 'House'],
  ['duplex', 'Duplex'],
  ['bungalow', 'Bungalow'],
  ['land', 'Land'],
  ['commercial', 'Commercial'],
  ['villa', 'Villa'],
  ['penthouse', 'Penthouse'],
] as const

/* ───────────────────────── Component ─────────────────────────────────────── */

export function ManualVerificationPanel() {
  // Form state
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [polygonJson, setPolygonJson] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [titleType, setTitleType] = useState('')
  const [titleFileNo, setTitleFileNo] = useState('')
  const [titleHolder, setTitleHolder] = useState('')
  const [titleAuthority, setTitleAuthority] = useState('')
  const [titleDate, setTitleDate] = useState('')

  // Results
  const [geoFindings, setGeoFindings] = useState<ClientFinding[]>([])
  const [footprintResult, setFootprintResult] = useState<FootprintResult | null>(null)
  const [footprintLoading, setFootprintLoading] = useState(false)
  const [footprintError, setFootprintError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)

  // Map
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  // ── Initialize map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [7.49, 9.06],
      zoom: 11,
      interactive: true,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150 }), 'bottom-left')

    mapRef.current = map
    return () => {
      markerRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Update map when lat/lng change ────────────────────────────────────────
  const updateMapMarker = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    if (isNaN(latN) || isNaN(lngN)) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (!markerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:#006aff;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`
      markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([lngN, latN]).addTo(map)
    } else {
      markerRef.current.setLngLat([lngN, latN])
    }

    map.flyTo({ center: [lngN, latN], zoom: 17, duration: 1200 })
  }, [lat, lng])

  useEffect(() => {
    const timeout = setTimeout(updateMapMarker, 400)
    return () => clearTimeout(timeout)
  }, [updateMapMarker])

  // ── Update map polygon layer ──────────────────────────────────────────────
  const updateMapPolygon = useCallback(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Remove existing layers/sources
    try {
      if (map.getLayer('manual-polygon-fill')) map.removeLayer('manual-polygon-fill')
      if (map.getLayer('manual-polygon-outline')) map.removeLayer('manual-polygon-outline')
      if (map.getSource('manual-polygon')) map.removeSource('manual-polygon')
    } catch { /* ignore */ }

    const parsed = parsePolygon(polygonJson)
    if (!parsed) return

    map.addSource('manual-polygon', {
      type: 'geojson',
      data: { type: 'Feature', geometry: parsed, properties: {} },
    })
    map.addLayer({
      id: 'manual-polygon-fill',
      type: 'fill',
      source: 'manual-polygon',
      paint: { 'fill-color': '#006aff', 'fill-opacity': 0.18 },
    })
    map.addLayer({
      id: 'manual-polygon-outline',
      type: 'line',
      source: 'manual-polygon',
      paint: { 'line-color': '#006aff', 'line-width': 2.5, 'line-dasharray': [3, 1.5] },
    })

    // Fit bounds
    const coords = parsed.coordinates[0]
    if (coords?.length > 2) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
      )
      map.fitBounds(bounds, { padding: 80, maxZoom: 19, duration: 800 })
    }
  }, [polygonJson])

  useEffect(() => {
    const timeout = setTimeout(updateMapPolygon, 500)
    return () => clearTimeout(timeout)
  }, [updateMapPolygon])

  // ── Update footprint buildings on map ─────────────────────────────────────
  const updateMapFootprints = useCallback((result: FootprintResult | null) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    try {
      if (map.getLayer('manual-footprints-fill')) map.removeLayer('manual-footprints-fill')
      if (map.getLayer('manual-footprints-outline')) map.removeLayer('manual-footprints-outline')
      if (map.getSource('manual-footprints')) map.removeSource('manual-footprints')
    } catch { /* ignore */ }

    if (!result?.building_footprints?.features?.length) return

    map.addSource('manual-footprints', {
      type: 'geojson',
      data: result.building_footprints,
    })
    map.addLayer({
      id: 'manual-footprints-fill',
      type: 'fill',
      source: 'manual-footprints',
      paint: { 'fill-color': '#f97316', 'fill-opacity': 0.4 },
    })
    map.addLayer({
      id: 'manual-footprints-outline',
      type: 'line',
      source: 'manual-footprints',
      paint: { 'line-color': '#f97316', 'line-width': 1.5 },
    })
  }, [])

  // ── Run checks ────────────────────────────────────────────────────────────
  const runChecks = async () => {
    setHasRun(true)

    // Geo sanity checks (client-side, instant)
    const latN = lat.trim() ? parseFloat(lat) : null
    const lngN = lng.trim() ? parseFloat(lng) : null
    const geo = runGeoSanityChecks({
      latitude: latN,
      longitude: lngN,
      polygon_geojson: polygonJson.trim() || null,
      property_type: propertyType || null,
    })
    setGeoFindings(geo)

    // Footprint check (server-side, needs polygon or coords)
    const polygon = parsePolygon(polygonJson)
    if (!polygon && latN == null) {
      setFootprintError('Provide coordinates or a polygon to run building footprint check.')
      setFootprintResult(null)
      return
    }

    setFootprintLoading(true)
    setFootprintError(null)
    setFootprintResult(null)

    try {
      // Build a synthetic query — the backend footprint-check endpoint expects
      // a listing ID, but we can also call it with raw coordinates via a
      // dedicated manual-check proxy route. For now, we'll post to a Next.js
      // API route that proxies to the backend.
      const data = await be.send<FootprintResult>(
        '/admin/manual-footprint-check',
        'POST',
        {
          latitude: latN,
          longitude: lngN,
          polygon_geojson: polygonJson.trim() || null,
          property_type: propertyType || null,
        },
      )
      setFootprintResult(data)
      updateMapFootprints(data)
    } catch (e) {
      const msg = (e as Error).message || 'Footprint check failed'
      if (msg.includes('not yet loaded') || msg.includes('503') || msg.includes('not found')) {
        setFootprintError('dataset_pending')
      } else {
        setFootprintError(msg)
      }
    } finally {
      setFootprintLoading(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const parsed = parsePolygon(polygonJson)
  const polyArea = parsed ? polygonAreaM2(parsed) : null
  const polyCentroid = parsed ? polygonCentroid(parsed) : null
  const allFindings = [...geoFindings, ...(footprintResult?.findings ?? [])]
  const passCount = allFindings.filter(f => f.state === 'pass').length
  const failCount = allFindings.filter(f => f.state === 'fail').length

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-input border border-divider bg-white text-navy text-body-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-action focus:border-transparent transition-all duration-150 placeholder-placeholder'
  const selectCls = inputCls + ' appearance-none'

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 text-navy flex items-center gap-2">
            <Crosshair size={20} className="text-action" strokeWidth={1.8} />
            Manual Verification
          </h2>
          <p className="text-body-sm text-subtle mt-1">
            Enter plot details manually to run automated checks against satellite data.
          </p>
        </div>
      </div>

      {/* ── Split layout: Form | Map ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — Input Form */}
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-white rounded-card border border-divider shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={15} className="text-action" />
              <span className="text-body-sm font-semibold text-navy">Location</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1 block">Latitude</span>
                <input
                  className={inputCls}
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="e.g. 9.0765"
                  type="number"
                  step="any"
                />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1 block">Longitude</span>
                <input
                  className={inputCls}
                  value={lng}
                  onChange={e => setLng(e.target.value)}
                  placeholder="e.g. 7.3986"
                  type="number"
                  step="any"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1 block">
                Polygon GeoJSON
              </span>
              <textarea
                className={`${inputCls} font-mono text-[11px] resize-none`}
                rows={4}
                value={polygonJson}
                onChange={e => setPolygonJson(e.target.value)}
                placeholder='{"type":"Polygon","coordinates":[[[7.49,9.06],[7.492,9.06],[7.492,9.062],[7.49,9.062],[7.49,9.06]]]}'
              />
              {parsed && (
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-subtle">
                  <span>Area: <strong className="text-navy">{polyArea?.toFixed(0)} m²</strong></span>
                  {polyCentroid && (
                    <span>
                      Centroid: {polyCentroid.lat.toFixed(5)}, {polyCentroid.lng.toFixed(5)}
                    </span>
                  )}
                </div>
              )}
            </label>

            <label className="block">
              <span className="text-caption text-subtle font-semibold mb-1 block">Property Type</span>
              <div className="relative">
                <select className={selectCls} value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                  {PROPERTY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
              </div>
            </label>
          </section>

          {/* Title details — collapsible */}
          <details className="bg-white rounded-card border border-divider shadow-card overflow-hidden group">
            <summary className="px-5 py-4 cursor-pointer hover:bg-beige/30 transition-colors flex items-center gap-2">
              <FileText size={15} className="text-action" />
              <span className="text-body-sm font-semibold text-navy">Title Document Details</span>
              <span className="text-caption text-placeholder ml-auto">Optional</span>
            </summary>
            <div className="px-5 pb-5 space-y-3 border-t border-divider pt-4">
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1 block">Title Type</span>
                <div className="relative">
                  <select className={selectCls} value={titleType} onChange={e => setTitleType(e.target.value)}>
                    {TITLE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-caption text-subtle font-semibold mb-1 block">File Number</span>
                  <input className={inputCls} value={titleFileNo} onChange={e => setTitleFileNo(e.target.value)} placeholder="e.g. MISC 12345" />
                </label>
                <label className="block">
                  <span className="text-caption text-subtle font-semibold mb-1 block">Issue Date</span>
                  <input className={inputCls} type="date" value={titleDate} onChange={e => setTitleDate(e.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1 block">Title Holder</span>
                <input className={inputCls} value={titleHolder} onChange={e => setTitleHolder(e.target.value)} placeholder="Name on title document" />
              </label>
              <label className="block">
                <span className="text-caption text-subtle font-semibold mb-1 block">Issuing Authority</span>
                <input className={inputCls} value={titleAuthority} onChange={e => setTitleAuthority(e.target.value)} placeholder="e.g. Federal Capital Territory Administration" />
              </label>
            </div>
          </details>

          {/* Run button */}
          <button
            onClick={runChecks}
            disabled={footprintLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-action hover:bg-action-hover text-white font-semibold py-3.5 rounded-button transition-all duration-150 disabled:opacity-50 shadow-sm"
          >
            {footprintLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Running Checks…
              </>
            ) : (
              <>
                <ShieldCheck size={16} strokeWidth={2} /> Run Verification Checks
              </>
            )}
          </button>
        </div>

        {/* Right — Map + Legend */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
              <Layers size={14} className="text-action" />
              <span className="text-body-sm font-semibold text-navy">Satellite View</span>
              {hasRun && footprintResult && (
                <span className="ml-auto text-caption text-subtle">
                  {footprintResult.buildings_inside_count} building(s) detected
                </span>
              )}
            </div>
            <div
              ref={mapContainerRef}
              className="w-full"
              style={{ height: 480 }}
            />
            {/* Map legend */}
            <div className="px-4 py-2.5 bg-beige/40 border-t border-divider flex items-center gap-5 text-[10px] text-navy">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border-2 border-[#006aff] bg-[#006aff]/20 flex-shrink-0" />
                Declared plot boundary
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border-2 border-orange-500 bg-orange-500/40 flex-shrink-0" />
                Google Open Buildings (v3)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#006aff] border-2 border-white shadow flex-shrink-0" />
                Declared coordinates
              </div>
            </div>
          </div>

          {/* Quick info cards — show after running */}
          {hasRun && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-card border border-divider shadow-card p-3.5 text-center">
                <p className="text-[10px] text-placeholder uppercase tracking-wider mb-1">Buildings Inside</p>
                <p className="text-xl font-bold text-navy">
                  {footprintResult?.buildings_inside_count ?? '—'}
                </p>
              </div>
              <div className="bg-white rounded-card border border-divider shadow-card p-3.5 text-center">
                <p className="text-[10px] text-placeholder uppercase tracking-wider mb-1">Footprint Area</p>
                <p className="text-xl font-bold text-navy">
                  {footprintResult?.total_footprint_area_m2 != null
                    ? `${footprintResult.total_footprint_area_m2.toFixed(0)} m²`
                    : '—'}
                </p>
              </div>
              <div className="bg-white rounded-card border border-divider shadow-card p-3.5 text-center">
                <p className="text-[10px] text-placeholder uppercase tracking-wider mb-1">Coverage</p>
                <p className="text-xl font-bold text-navy">
                  {footprintResult?.coverage_ratio != null
                    ? `${(footprintResult.coverage_ratio * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Findings results panel ───────────────────────────────────── */}
      {hasRun && (
        <section className="bg-white rounded-card border border-divider shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-divider flex items-center gap-2">
            <ShieldCheck size={16} className="text-action" />
            <h3 className="text-h4 text-navy">Verification Results</h3>
            <div className="ml-auto flex items-center gap-4 text-caption text-subtle">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-verified" /> {passCount} pass
              </span>
              <span className="flex items-center gap-1">
                {failCount > 0 ? <XCircle size={12} className="text-danger" /> : <CheckCircle2 size={12} className="text-verified" />}
                {failCount} fail
              </span>
            </div>
          </div>

          {allFindings.length === 0 && !footprintError ? (
            <div className="p-8 text-center text-body-sm text-subtle">
              No findings. Provide coordinates or a polygon and run checks.
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {/* Geo sanity section */}
              {geoFindings.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={13} className="text-subtle" />
                    <span className="text-body-sm font-semibold text-navy">Geo Sanity</span>
                  </div>
                  <ul className="space-y-2">
                    {geoFindings.map((f, i) => <FindingRow key={i} f={f} />)}
                  </ul>
                </div>
              )}

              {/* Footprint section */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Building2 size={13} className="text-subtle" />
                  <span className="text-body-sm font-semibold text-navy">Building Footprint</span>
                </div>
                {footprintError === 'dataset_pending' ? (
                  <div className="bg-beige/60 rounded p-3 text-caption text-subtle leading-relaxed">
                    <p className="font-semibold text-navy mb-1">Building footprint dataset not loaded</p>
                    <p>
                      The Google Open Buildings v3 dataset for FCT is not yet loaded into the database.
                      Run <code className="text-[11px] bg-beige px-1 rounded">python scripts/load_abuja_buildings.py</code> to populate it.
                    </p>
                  </div>
                ) : footprintError ? (
                  <p className="text-caption text-danger">{footprintError}</p>
                ) : footprintResult?.findings?.length ? (
                  <ul className="space-y-2">
                    {footprintResult.findings.map((f, i) => <FindingRow key={i} f={f} />)}
                  </ul>
                ) : footprintResult ? (
                  <p className="text-caption text-subtle">No footprint findings.</p>
                ) : (
                  <p className="text-caption text-subtle">Click "Run Verification Checks" to query building footprints.</p>
                )}
              </div>

              {/* Overall verdict */}
              {allFindings.length > 0 && (
                <div className="px-5 py-4">
                  <OverallVerdict findings={allFindings} />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function FindingRow({ f }: { f: ClientFinding }) {
  const icon =
    f.state === 'pass'
      ? <CheckCircle2 size={14} className="text-verified flex-shrink-0 mt-0.5" />
      : f.severity === 'block'
        ? <XCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
        : <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />

  const sevColor =
    f.severity === 'block' ? 'bg-danger-light text-danger'
    : f.severity === 'flag' ? 'bg-warning-light text-warning'
    : 'bg-beige text-subtle'

  return (
    <li className="flex items-start gap-2.5 py-1">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm text-navy">{f.message}</p>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${sevColor}`}>
        {f.severity}
      </span>
    </li>
  )
}

function OverallVerdict({ findings }: { findings: ClientFinding[] }) {
  const blocks = findings.filter(f => f.severity === 'block' && f.state === 'fail')
  const flags = findings.filter(f => f.severity === 'flag' && f.state === 'fail')
  const passes = findings.filter(f => f.state === 'pass')

  if (blocks.length > 0) {
    return (
      <div className="flex items-start gap-3 bg-danger-light/50 border border-danger/20 rounded-card p-4">
        <XCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-navy">Verification Blocked</p>
          <p className="text-body-sm text-subtle mt-1">
            {blocks.length} blocking issue{blocks.length > 1 ? 's' : ''} detected.
            {flags.length > 0 && ` ${flags.length} additional flag${flags.length > 1 ? 's' : ''} raised.`}
          </p>
        </div>
      </div>
    )
  }

  if (flags.length > 0) {
    return (
      <div className="flex items-start gap-3 bg-warning-light/50 border border-warning/20 rounded-card p-4">
        <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-navy">Review Required</p>
          <p className="text-body-sm text-subtle mt-1">
            {flags.length} flag{flags.length > 1 ? 's' : ''} raised for manual review. {passes.length} check{passes.length !== 1 ? 's' : ''} passed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 bg-verified-light/50 border border-verified/20 rounded-card p-4">
      <CheckCircle2 size={20} className="text-verified flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-navy">All Checks Passed</p>
        <p className="text-body-sm text-subtle mt-1">
          {passes.length} automated check{passes.length !== 1 ? 's' : ''} passed with no issues.
        </p>
      </div>
    </div>
  )
}
