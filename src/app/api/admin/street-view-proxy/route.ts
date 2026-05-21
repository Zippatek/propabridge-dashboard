import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/street-view-proxy?lat=9.07&lng=7.49
 *
 * Server-side proxy for Google Street View Static API images.
 * Keeps the API key out of browser requests (not exposed in <img src>).
 *
 * Returns the raw JPEG image from Google Street View.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return new NextResponse('lat and lng are required', { status: 400 })
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    return new NextResponse('Google Maps API key not configured', { status: 503 })
  }

  const url = `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${lat},${lng}&fov=90&pitch=10&key=${key}`

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) {
      return new NextResponse('Street View fetch failed', { status: upstream.status })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // cache 24h — street view doesn't change often
      },
    })
  } catch (err) {
    return new NextResponse('Proxy error', { status: 500 })
  }
}
