import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { beFetch, ApiError } from '@/lib/api'

export async function GET(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const listingId = searchParams.get('listing_id')
  if (!listingId) {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }
  try {
    const data = await beFetch(`/listings/${listingId}/satellite-analysis`)
    return NextResponse.json(data)
  } catch (e) {
    const err = e as ApiError
    return NextResponse.json({ error: err.message || 'Upstream error' }, { status: err.status || 500 })
  }
}
