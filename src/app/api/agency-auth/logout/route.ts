import { NextResponse } from 'next/server'
import { clearAgencySession } from '@/lib/agency-auth'

export async function POST() {
  clearAgencySession()
  return NextResponse.json({ ok: true })
}
