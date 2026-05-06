'use client'

import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

/**
 * A Mapbox map with a polygon drawing tool.
 *
 * Props:
 *   onPolygonChange(geojson: string | null) — called when the user draws or
 *     deletes a polygon. The argument is a JSON string of the first Polygon
 *     feature, or null when nothing is drawn.
 *   initialCenter?: [lng, lat]  — default [7.49, 9.06] (Abuja)
 *   initialZoom?: number        — default 12
 *   initialPolygon?: string      — optional GeoJSON Polygon string to pre-fill
 */

interface PolygonDrawerProps {
  onPolygonChange: (geojson: string | null) => void
  initialCenter?: [number, number]
  initialZoom?: number
  initialPolygon?: string
}

export function PolygonDrawer({
  onPolygonChange,
  initialCenter = [7.49, 9.06],
  initialZoom = 12,
  initialPolygon,
}: PolygonDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const drawRef = useRef<MapboxDraw | null>(null)

  const emitPolygon = useCallback(
    (draw: MapboxDraw) => {
      const data = draw.getAll()
      const polygon = data.features.find(
        (f: GeoJSON.Feature) => f.geometry?.type === 'Polygon'
      )
      if (polygon) {
        // Strip the id and properties that MapboxDraw adds
        const clean: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: (polygon.geometry as GeoJSON.Polygon).coordinates,
        }
        onPolygonChange(JSON.stringify(clean))
      } else {
        onPolygonChange(null)
      }
    },
    [onPolygonChange],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.warn('NEXT_PUBLIC_MAPBOX_TOKEN not set — map will not render')
      return
    }
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: initialZoom,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
      styles: [
        // Polygon fill
        {
          id: 'propabridge-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          paint: {
            'fill-color': '#0e109f',
            'fill-outline-color': '#0e109f',
            'fill-opacity': 0.15,
          },
        },
        // Polygon outline
        {
          id: 'propabridge-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#0e109f',
            'line-width': 2.5,
            'line-dasharray': [2, 2],
          },
        },
        // Vertices
        {
          id: 'propabridge-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#0e109f',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        },
        // Midpoint
        {
          id: 'propabridge-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 3,
            'circle-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#0e109f',
          },
        },
      ],
    })

    map.addControl(draw, 'top-left')

    // Pre-fill with existing polygon if provided
    map.on('load', () => {
      if (initialPolygon) {
        try {
          const geojson = JSON.parse(initialPolygon)
          if (geojson.type === 'Polygon') {
            draw.add({
              type: 'Feature',
              properties: {},
              geometry: geojson,
            })
            // Fit map to the polygon
            const bounds = new mapboxgl.LngLatBounds()
            geojson.coordinates[0].forEach(([lng, lat]: [number, number]) => {
              bounds.extend([lng, lat])
            })
            map.fitBounds(bounds, { padding: 60, maxZoom: 16 })
            emitPolygon(draw)
          }
        } catch {
          // Invalid GeoJSON — ignore
        }
      }
    })

    map.on('draw.create', () => emitPolygon(draw))
    map.on('draw.update', () => emitPolygon(draw))
    map.on('draw.delete', () => emitPolygon(draw))

    mapRef.current = map
    drawRef.current = draw

    return () => {
      map.remove()
      mapRef.current = null
      drawRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (tokenMissing) {
    return (
      <div className="rounded-input border border-divider bg-beige/40 p-6 text-center space-y-2">
        <p className="text-body-sm font-semibold text-navy">Map drawer unavailable</p>
        <p className="text-caption text-subtle">
          NEXT_PUBLIC_MAPBOX_TOKEN is not set. Use the GeoJSON paste field
          below, or set the token to enable polygon drawing.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-input border border-divider overflow-hidden"
        style={{ height: 360 }}
      />
      <p className="text-caption text-subtle">
        Click points on the map to draw the property boundary. Double-click to close the polygon. Use the trash icon to delete and redraw.
      </p>
    </div>
  )
}
