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
  height?: number
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
      map.data.addGeoJson({
        type: 'Feature',
        geometry: listingPolygon,
        properties: { isListing: true },
      })
      listingPolygon.coordinates[0].forEach(([lng, lat]) => {
        bounds.extend({ lat, lng })
        hasBounds = true
      })
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
        const confidence = (Number(e.feature.getProperty('confidence') || 0) * 100).toFixed(0)
        const area = Number(e.feature.getProperty('area_in_meters') || 0).toFixed(0)
        
        infoWindowRef.current?.setContent(
          `<div style="font-size:11px;color:#001a40;font-family:sans-serif;">` +
          `<strong>Google Building</strong><br>` +
          `Confidence: ${confidence}%<br>` +
          `Area: ${area} m²` +
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

export function FootprintMapPreview({ height = '100%', ...props }: Props & { height?: number | string }) {
  const tokenMissing = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (tokenMissing) {
    return <div style={{ height }} className="bg-beige flex items-center justify-center text-subtle text-caption">Map unavailable (No API Key)</div>
  }

  return (
    <div className="relative w-full h-full" style={{ height }}>
      <Map
        defaultCenter={{ lat: 9.06, lng: 7.49 }}
        defaultZoom={12}
        mapTypeId="satellite"
        disableDefaultUI={true}
        gestureHandling="greedy"
      >
        <DataLayers {...props} />
      </Map>
    </div>
  )
}
