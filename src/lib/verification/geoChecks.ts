// Pure geospatial sanity checks for listing plots in Abuja FCT.
// No external dependencies — these run client-side or in API routes.

import type { ClientFinding } from './findings'

// FCT bounding box (loose). lat 8.40-9.40, lng 6.75-7.85.
const FCT_BBOX = { minLat: 8.4, maxLat: 9.4, minLng: 6.75, maxLng: 7.85 }

// Earth radius in metres.
const R = 6_371_000

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

interface Polygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export function parsePolygon(geojson: string | null | undefined): Polygon | null {
  if (!geojson) return null
  try {
    const obj = JSON.parse(geojson) as Polygon
    if (obj?.type !== 'Polygon' || !Array.isArray(obj.coordinates)) return null
    return obj
  } catch {
    return null
  }
}

// Polygon centroid via average of ring vertices — good enough for sanity
// checks at neighborhood scale (we're not doing land surveying here).
export function polygonCentroid(p: Polygon): { lat: number; lng: number } | null {
  const ring = p.coordinates?.[0]
  if (!ring || ring.length < 3) return null
  let sumLng = 0
  let sumLat = 0
  for (const [lng, lat] of ring) {
    sumLng += lng
    sumLat += lat
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length }
}

// Approximate polygon area in square metres using equirectangular projection
// centred on the polygon. Accurate within a few percent for plot-sized shapes.
export function polygonAreaM2(p: Polygon): number {
  const ring = p.coordinates?.[0]
  if (!ring || ring.length < 4) return 0
  const c = polygonCentroid(p)
  if (!c) return 0
  const latRad = (c.lat * Math.PI) / 180
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos(latRad)
  // Shoelace formula on projected coordinates.
  let area = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i]
    const [lng2, lat2] = ring[i + 1]
    const x1 = lng1 * mPerDegLng
    const y1 = lat1 * mPerDegLat
    const x2 = lng2 * mPerDegLng
    const y2 = lat2 * mPerDegLat
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

export interface GeoSanityInput {
  latitude: number | null | undefined
  longitude: number | null | undefined
  polygon_geojson: string | null | undefined
  property_type?: string | null | undefined
}

export function runGeoSanityChecks(input: GeoSanityInput): ClientFinding[] {
  const findings: ClientFinding[] = []

  // FCT bounding box check.
  if (input.latitude != null && input.longitude != null) {
    const inside =
      input.latitude >= FCT_BBOX.minLat &&
      input.latitude <= FCT_BBOX.maxLat &&
      input.longitude >= FCT_BBOX.minLng &&
      input.longitude <= FCT_BBOX.maxLng
    findings.push({
      code: 'geo.fct_bounding_box',
      severity: inside ? 'info' : 'block',
      state: inside ? 'pass' : 'fail',
      message: inside
        ? 'Coordinates fall inside the Abuja FCT bounding box.'
        : 'Coordinates fall outside the Abuja FCT bounding box.',
      details: {
        latitude: input.latitude,
        longitude: input.longitude,
        bbox: FCT_BBOX,
      },
    })
  }

  // Polygon checks.
  const polygon = parsePolygon(input.polygon_geojson)
  if (polygon) {
    const centroid = polygonCentroid(polygon)
    const area = polygonAreaM2(polygon)

    // Centroid vs declared lat/lng.
    if (centroid && input.latitude != null && input.longitude != null) {
      const dist = haversineMeters(centroid, { lat: input.latitude, lng: input.longitude })
      const ok = dist <= 100
      findings.push({
        code: 'geo.centroid_matches_declared',
        severity: ok ? 'info' : 'flag',
        state: ok ? 'pass' : 'fail',
        message: ok
          ? `Polygon centroid is ${dist.toFixed(0)}m from declared coordinates.`
          : `Polygon centroid is ${dist.toFixed(0)}m from declared coordinates — should be within 100m.`,
        details: { distance_m: dist, centroid, declared: { lat: input.latitude, lng: input.longitude } },
      })
    }

    // Sanity bounds on plot area: 30 m² – 50,000 m² covers anything from
    // a tiny shop unit to a multi-acre estate. Outside that range is almost
    // certainly a drawing error.
    if (area > 0) {
      const inRange = area >= 30 && area <= 50_000
      findings.push({
        code: 'geo.polygon_area_sane',
        severity: inRange ? 'info' : 'flag',
        state: inRange ? 'pass' : 'fail',
        message: inRange
          ? `Polygon area is ${area.toFixed(0)} m² — within sane bounds.`
          : `Polygon area is ${area.toFixed(0)} m² — outside sane bounds (30 m² – 50,000 m²).`,
        details: { area_m2: area },
      })
    }
  } else if (input.polygon_geojson) {
    findings.push({
      code: 'geo.polygon_parse',
      severity: 'flag',
      state: 'fail',
      message: 'Polygon GeoJSON could not be parsed.',
    })
  }

  return findings
}
