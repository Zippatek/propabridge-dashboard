'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { Trash2 } from 'lucide-react'

interface PolygonDrawerProps {
  onPolygonChange: (geojson: string | null) => void
  initialCenter?: [number, number]
  initialZoom?: number
  initialPolygon?: string
}

function DrawingComponent({
  onPolygonChange,
  initialPolygon,
}: {
  onPolygonChange: (geojson: string | null) => void
  initialPolygon?: string
}) {
  const map = useMap()
  const drawing = useMapsLibrary('drawing')
  const [manager, setManager] = useState<google.maps.drawing.DrawingManager | null>(null)
  const currentPolygonRef = useRef<google.maps.Polygon | null>(null)

  useEffect(() => {
    if (!map || !drawing) return

    const drawingManager = new drawing.DrawingManager({
      drawingMode: drawing.OverlayType.POLYGON,
      drawingControl: false, // We'll build custom controls if needed, or rely on the default mode
      polygonOptions: {
        fillColor: '#0e109f',
        fillOpacity: 0.15,
        strokeColor: '#0e109f',
        strokeWeight: 2.5,
        editable: true,
        zIndex: 1,
      },
    })
    drawingManager.setMap(map)
    setManager(drawingManager)

    // Wait for the polygon to be drawn
    google.maps.event.addListener(drawingManager, 'overlaycomplete', (e: google.maps.drawing.OverlayCompleteEvent) => {
      if (e.type === drawing.OverlayType.POLYGON) {
        // Remove previous polygon if any
        if (currentPolygonRef.current) {
          currentPolygonRef.current.setMap(null)
        }

        const polygon = e.overlay as google.maps.Polygon
        currentPolygonRef.current = polygon

        // Turn off drawing mode so they can interact
        drawingManager.setDrawingMode(null)

        const emitPoly = () => {
          const path = polygon.getPath()
          const coordinates: number[][] = []
          for (let i = 0; i < path.getLength(); i++) {
            const latLng = path.getAt(i)
            coordinates.push([latLng.lng(), latLng.lat()])
          }
          // Close the polygon
          if (coordinates.length > 0) {
            coordinates.push([...coordinates[0]])
          }
          onPolygonChange(JSON.stringify({ type: 'Polygon', coordinates: [coordinates] }))
        }

        emitPoly()

        // Listen for edits
        const path = polygon.getPath()
        google.maps.event.addListener(path, 'set_at', emitPoly)
        google.maps.event.addListener(path, 'insert_at', emitPoly)
        google.maps.event.addListener(path, 'remove_at', emitPoly)
      }
    })

    return () => {
      drawingManager.setMap(null)
    }
  }, [map, drawing, onPolygonChange])

  // Handle initial polygon
  useEffect(() => {
    if (!map || !manager || !initialPolygon) return
    try {
      const geojson = JSON.parse(initialPolygon)
      if (geojson.type === 'Polygon' && !currentPolygonRef.current) {
        const coords = geojson.coordinates[0] as [number, number][]
        const paths = coords.map(([lng, lat]) => ({ lat, lng }))
        const polygon = new google.maps.Polygon({
          paths,
          fillColor: '#0e109f',
          fillOpacity: 0.15,
          strokeColor: '#0e109f',
          strokeWeight: 2.5,
          editable: true,
          zIndex: 1,
          map,
        })
        currentPolygonRef.current = polygon
        manager.setDrawingMode(null)

        const bounds = new google.maps.LatLngBounds()
        paths.forEach(p => bounds.extend(p))
        map.fitBounds(bounds)
      }
    } catch {
      // invalid geojson
    }
  }, [map, manager, initialPolygon])

  return (
    <div className="absolute top-2 right-2 bg-white rounded-card shadow-sm border border-divider p-1 z-10 flex gap-2">
      <button
        type="button"
        className="p-2 text-subtle hover:text-navy hover:bg-beige rounded transition-colors tooltip-trigger"
        onClick={() => {
          if (currentPolygonRef.current) {
            currentPolygonRef.current.setMap(null)
            currentPolygonRef.current = null
            onPolygonChange(null)
          }
          if (manager) {
            // @ts-ignore
            manager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
          }
        }}
        title="Clear drawing"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export function PolygonDrawer({
  onPolygonChange,
  initialCenter = [7.49, 9.06],
  initialZoom = 12,
  initialPolygon,
}: PolygonDrawerProps) {
  const tokenMissing = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (tokenMissing) {
    return (
      <div className="rounded-input border border-divider bg-beige/40 p-6 text-center space-y-2">
        <p className="text-body-sm font-semibold text-navy">Map drawer unavailable</p>
        <p className="text-caption text-subtle">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Use the GeoJSON paste field
          below, or set the token to enable polygon drawing.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="relative w-full rounded-input border border-divider overflow-hidden"
        style={{ height: 360 }}
      >
        <Map
          style={{ width: '100%', height: '100%' }}
          mapId="propabridge-polygon-drawer"
          defaultCenter={{ lat: initialCenter[1], lng: initialCenter[0] }}
          defaultZoom={initialZoom}
          mapTypeId="satellite"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          <DrawingComponent
            onPolygonChange={onPolygonChange}
            initialPolygon={initialPolygon}
          />
        </Map>
      </div>
      <p className="text-caption text-subtle">
        Click points on the map to draw the property boundary. Double-click to close the polygon. Use the trash icon to delete and redraw.
      </p>
    </div>
  )
}
