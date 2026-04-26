import { NextResponse } from 'next/server'
import { setAdminSession } from '@/lib/admin-auth'
import { verifyAdminPassword } from '@/lib/api'

export async function POST(req: Request) {
  const { key } = (await req.json().catch(() => ({}))) as { key?: string }

  if (!process.env.ADMIN_DASHBOARD_KEY) {
    return NextResponse.json(
      { error: 'ADMIN_DASHBOARD_KEY not configured on this dashboard server' },
      { status: 500 },
    )
  }
  if (!key || !(await verifyAdminPassword(key))) {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 })
  }

  setAdminSession()
  return NextResponse.json({ ok: true })
}
