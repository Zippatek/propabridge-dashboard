'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface GeoJsonPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

interface FeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSON.Feature[]
}

interface Props {
  listingPolygon: GeoJsonPolygon | null
  buildingFootprints: FeatureCollection | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * Read-only Mapbox satellite view used on the verifications detail page.
 * Renders:
 *   - Mapbox satellite base layer
 *   - Listing's drawn polygon (blue, semi-transparent fill)
 *   - Google Open Buildings v3 detected footprints (orange outline + fill)
 *
 * Falls back to centering on lat/lng when no polygon is drawn.
 */
export function FootprintMapPreview({
  listingPolygon,
  buildingFootprints,
  latitude,
  longitude,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    mapboxgl.accessToken = token

    // Compute map center + zoom.
    let center: [number, number] = [7.49, 9.06] // default: Abuja city centre
    let zoom = 12

    if (listingPolygon?.coordinates?.[0]?.length) {
      // Centroid of the polygon ring.
      const ring = listingPolygon.coordinates[0]
      const lngs = ring.map(c => c[0])
      const lats = ring.map(c => c[1])
      center = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ]
      zoom = 17
    } else if (latitude != null && longitude != null) {
      center = [longitude, latitude]
      zoom = 17
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom,
      interactive: true,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      // ── Listing polygon ───────────────────────────────────────────────────
      if (listingPolygon) {
        map.addSource('listing-polygon', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: listingPolygon,
            properties: {},
          },
        })
        map.addLayer({
          id: 'listing-polygon-fill',
          type: 'fill',
          source: 'listing-polygon',
          paint: {
            'fill-color': '#2563eb',
            'fill-opacity': 0.15,
          },
        })
        map.addLayer({
          id: 'listing-polygon-outline',
          type: 'line',
          source: 'listing-polygon',
          paint: {
            'line-color': '#2563eb',
            'line-width': 2.5,
            'line-dasharray': [3, 1.5],
          },
        })

        // Fit map to the polygon bounds with padding.
        const coords = listingPolygon.coordinates[0]
        const bounds = coords.reduce(
          (b, c) => b.extend(c as [number, number]),
          new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number]),
        )
        map.fitBounds(bounds, { padding: 80, maxZoom: 19 })
      }

      // ── Google Open Buildings footprints ──────────────────────────────────
      if (buildingFootprints && buildingFootprints.features.length > 0) {
        map.addSource('building-footprints', {
          type: 'geojson',
          data: buildingFootprints,
        })
        map.addLayer({
          id: 'building-footprints-fill',
          type: 'fill',
          source: 'building-footprints',
          paint: {
            'fill-color': '#f97316',
            'fill-opacity': 0.35,
          },
        })
        map.addLayer({
          id: 'building-footprints-outline',
          type: 'line',
          source: 'building-footprints',
          paint: {
            'line-color': '#f97316',
            'line-width': 1.5,
          },
        })

        // Hover tooltip — show confidence score.
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'footprint-popup',
        })

        map.on('mouseenter', 'building-footprints-fill', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          const props = e.features?.[0]?.properties
          if (!props) return
          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="text-[11px] text-navy">` +
              `<strong>Google Building</strong><br>` +
              `Confidence: ${(Number(props.confidence) * 100).toFixed(0)}%<br>` +
              `Area: ${Number(props.area_in_meters || 0).toFixed(0)} m²` +
              `</div>`,
            )
            .addTo(map)
        })
        map.on('mouseleave', 'building-footprints-fill', () => {
          map.getCanvas().style.cursor = ''
          popup.remove()
        })
      }
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [listingPolygon, buildingFootprints, latitude, longitude])

  return (
    <div className="relative rounded-input overflow-hidden border border-divider" style={{ height: 340 }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-8 left-3 bg-white/90 backdrop-blur-sm rounded px-2.5 py-1.5 shadow text-[10px] space-y-1 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-blue-600 bg-blue-600/20 flex-shrink-0" />
          <span className="text-navy">Declared plot boundary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-orange-500 bg-orange-500/35 flex-shrink-0" />
          <span className="text-navy">Google Open Buildings (v3)</span>
        </div>
      </div>
    </div>
  )
}
