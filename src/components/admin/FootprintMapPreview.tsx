'use client'

import { useEffect, useRef } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'

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
  height?: number | string
}

function DataLayers({
  listingPolygon,
  buildingFootprints,
  latitude,
  longitude,
}: Props) {
  const map = useMap()
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  useEffect(() => {
    if (!map) return

    // Clear existing data and listeners
    map.data.forEach(f => map.data.remove(f))
    google.maps.event.clearListeners(map.data, 'mouseover')
    google.maps.event.clearListeners(map.data, 'mouseout')

    let bounds = new google.maps.LatLngBounds()
    let hasBounds = false

    if (listingPolygon) {
      // Unwrap Feature → raw Geometry if backend returns a GeoJSON Feature object
      const geom: GeoJsonPolygon =
        (listingPolygon as unknown as { type: string; geometry: GeoJsonPolygon }).type === 'Feature'
          ? (listingPolygon as unknown as { geometry: GeoJsonPolygon }).geometry
          : listingPolygon
      map.data.addGeoJson({
        type: 'Feature',
        geometry: geom,
        properties: { isListing: true },
      })
      if (geom?.coordinates?.[0]) {
        geom.coordinates[0].forEach(([lng, lat]) => {
          bounds.extend({ lat, lng })
          hasBounds = true
        })
      }
    }

    if (buildingFootprints && buildingFootprints.features.length > 0) {
      // Add a property to identify building footprints
      const footprintsWithProps = {
        ...buildingFootprints,
        features: buildingFootprints.features.map(f => ({
          ...f,
          properties: { ...f.properties, isBuilding: true },
        })),
      }
      map.data.addGeoJson(footprintsWithProps)
    }

    if (hasBounds) {
      map.fitBounds(bounds)
    } else if (latitude != null && longitude != null) {
      map.setCenter({ lat: latitude, lng: longitude })
      map.setZoom(17)
    } else {
      map.setCenter({ lat: 9.06, lng: 7.49 })
      map.setZoom(12)
    }

    map.data.setStyle((feature) => {
      if (feature.getProperty('isListing')) {
        return {
          fillColor: '#2563eb',
          fillOpacity: 0.15,
          strokeColor: '#2563eb',
          strokeWeight: 2.5,
          clickable: false,
        }
      }
      if (feature.getProperty('isBuilding')) {
        const source = feature.getProperty('source') as string
        if (source === 'osm') {
          return {
            fillColor: '#06b6d4',
            fillOpacity: 0.35,
            strokeColor: '#06b6d4',
            strokeWeight: 1.5,
          }
        }
        if (source === 'both') {
          return {
            fillColor: '#22c55e',
            fillOpacity: 0.40,
            strokeColor: '#22c55e',
            strokeWeight: 2,
          }
        }
        return {
          fillColor: '#f97316',
          fillOpacity: 0.35,
          strokeColor: '#f97316',
          strokeWeight: 1.5,
        }
      }
      return {}
    })

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow({
        disableAutoPan: true,
      })
    }

    map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
      if (e.feature.getProperty('isBuilding')) {
        const source = e.feature.getProperty('source') as string
        const confidence = (Number(e.feature.getProperty('confidence') || 0) * 100).toFixed(0)
        const area = Number(e.feature.getProperty('area_in_meters') || 0).toFixed(0)

        let label = 'Google Building'
        let extra = `Confidence: ${confidence}%<br>Area: ${area} m²`
        if (source === 'osm') {
          const bType = e.feature.getProperty('building_type') as string
          const levels = e.feature.getProperty('levels') as string
          label = 'OSM Building'
          extra = (bType ? `Type: ${bType}<br>` : '') + (levels ? `Levels: ${levels}<br>` : '') + `Area: ${area} m²`
        } else if (source === 'both') {
          label = 'Confirmed by both datasets'
          extra = `Confidence: ${confidence}%<br>Area: ${area} m²`
        }

        infoWindowRef.current?.setContent(
          `<div style="font-size:11px;color:#001a40;font-family:sans-serif;">` +
          `<strong>${label}</strong><br>` +
          extra +
          `</div>`
        )
        infoWindowRef.current?.setPosition(e.latLng)
        infoWindowRef.current?.open(map)
      }
    })

    map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
      if (e.feature.getProperty('isBuilding')) {
        infoWindowRef.current?.close()
      }
    })
  }, [map, listingPolygon, buildingFootprints, latitude, longitude])

  return null
}

export function FootprintMapPreview({ height = '100%', ...props }: Props) {
  const tokenMissing = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (tokenMissing) {
    return <div style={{ height }} className="bg-beige flex items-center justify-center text-subtle text-caption">Map unavailable (No API Key)</div>
  }

  return (
    <div className="relative w-full h-full" style={{ height }}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: 9.06, lng: 7.49 }}
        defaultZoom={12}
        mapTypeId="satellite"
        disableDefaultUI={false}
        gestureHandling="greedy"
      >
        <DataLayers {...props} />
      </Map>
      {/* Legend */}
      <div className="absolute bottom-8 left-3 bg-white/90 backdrop-blur-sm rounded px-2.5 py-1.5 shadow text-[10px] space-y-1 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#2563eb] bg-[#2563eb]/20 flex-shrink-0" />
          <span className="text-navy">Declared plot boundary</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#f97316] bg-[#f97316]/35 flex-shrink-0" />
          <span className="text-navy">Google Buildings (2023)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#06b6d4] bg-[#06b6d4]/35 flex-shrink-0" />
          <span className="text-navy">OSM Buildings (live)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#22c55e] bg-[#22c55e]/40 flex-shrink-0" />
          <span className="text-navy">Confirmed by both</span>
        </div>
      </div>
    </div>
  )
}
