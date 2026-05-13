import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { proxyMultipartUpload } from '@/lib/admin-upload-proxy'

/**
 * Proxy: POST /api/admin/upload-plan → POST <backend>/listings/uploads/plan
 */
export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return proxyMultipartUpload(req, { backendPath: '/listings/uploads/plan' })
}
