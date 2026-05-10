import { NextResponse } from 'next/server'
import { isAdminAuthed } from '@/lib/admin-auth'
import { adkFetch, ApiError } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ConversationItem = {
  id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  score?: number | null
  intent?: string | null
  relationship_stage?: string | null
  next_best_action?: string | null
  risk_of_churn?: number | null
  created_at?: string | null
  updated_at?: string | null
}

function stageFromConversation(item: ConversationItem): string {
  if (item.relationship_stage) return item.relationship_stage
  const score = item.score ?? 0
  if (score >= 80) return 'hot_lead'
  if (score >= 50) return 'qualified'
  if (item.intent) return 'qualifying'
  return 'new'
}

function nextActionFromStage(stage: string): string {
  switch (stage) {
    case 'hot_lead':
      return 'Escalate to admin/agency and move toward viewing or direct human follow-up.'
    case 'qualified':
      return 'Send relevant verified matches or ask for one missing decision detail.'
    case 'waitlisted':
      return 'Only notify when a genuinely matching verified listing appears.'
    case 'viewing_scheduled':
      return 'Protect the booking with reminders and post-viewing feedback.'
    case 'fresh_start':
      return 'Treat the next message as a fresh conversation and avoid referencing old chat.'
    default:
      return 'Qualify gently with one helpful question at a time.'
  }
}

function fallbackProfile(item: ConversationItem) {
  const stage = stageFromConversation(item)
  const label = item.name || item.phone || item.email || item.id
  return {
    id: `fallback_${item.id}`,
    user_id: item.phone || item.id,
    active_session_id: item.id,
    lead_id: null,
    channel: item.id?.startsWith('wa_') ? 'whatsapp' : 'web',
    phone: item.phone || null,
    profile_name: item.name || null,
    assigned_agent_name: 'Propa',
    relationship_stage: stage,
    intent: item.intent || null,
    budget: null,
    property_type: null,
    bedrooms: null,
    preferred_locations: [],
    timeline: null,
    relationship_summary: `${label} is being tracked from existing conversation data. Full relationship memory will populate after the updated ADK backend is active.`,
    next_best_action: item.next_best_action || nextActionFromStage(stage),
    next_followup_at: null,
    followup_cadence_days: stage === 'hot_lead' ? 1 : 7,
    engagement_score: Math.min(100, Math.max(item.score ?? 0, 10)),
    conversion_score: item.score ?? 0,
    risk_of_churn: item.risk_of_churn ?? 0,
    last_user_message_at: item.updated_at || null,
    last_agent_message_at: item.updated_at || null,
    last_contacted_at: null,
    suppress_memory_until: null,
    reset_count: 0,
    opted_out: false,
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
    metadata: {
      source: 'dashboard_fallback_from_conversations',
      note: 'ADK /api/admin/relationship-profiles was unavailable; synthesized from /api/admin/conversations.',
    },
  }
}

export async function GET(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const requestedLimit = Number(searchParams.get('limit') || '500')
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 500) : 500
  const conversationFallbackLimit = Math.min(limit, 200)
  const stage = searchParams.get('stage')
  const upstreamPath = `/api/admin/relationship-profiles?${searchParams.toString() || `limit=${limit}`}`

  try {
    const data = await adkFetch(upstreamPath)
    return NextResponse.json(data)
  } catch (e) {
    const err = e as ApiError
    if (err.status !== 404) {
      return NextResponse.json(
        { error: err.message || 'Upstream error' },
        { status: err.status || 500 },
      )
    }
  }

  try {
    const data = await adkFetch<{ items?: ConversationItem[] }>(
      `/api/admin/conversations?limit=${encodeURIComponent(String(conversationFallbackLimit))}`,
    )
    let items = (data.items || []).map(fallbackProfile)
    if (stage && stage !== 'all') {
      items = items.filter((p) => p.relationship_stage === stage)
    }
    return NextResponse.json({
      items,
      total: items.length,
      fallback: true,
      note: `Using conversation-derived fallback profiles because ADK relationship endpoint is unavailable. Fallback is capped at ${conversationFallbackLimit} conversations.`,
    })
  } catch (e) {
    const err = e as ApiError
    return NextResponse.json(
      { error: err.message || 'Unable to load relationship profiles' },
      { status: err.status || 500 },
    )
  }
}

export async function POST(req: Request) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { profileId, sessionId, note, agentName } = body

    if (!note || typeof note !== 'string' || !note.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    if (note.length > 2000) {
      return NextResponse.json({ error: 'Note must be ≤ 2000 characters' }, { status: 400 })
    }

    // Save note through backend endpoint
    const endpoint = sessionId ? `/api/admin/conversations/${sessionId}/relationship/note` : null
    if (!endpoint) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const result = await adkFetch<Record<string, any>>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        note: note.trim(),
        agent_name: agentName || 'admin',
      }),
    })

    return NextResponse.json({ saved: true, ...result })
  } catch (e) {
    const err = e as ApiError
    return NextResponse.json(
      { error: err.message || 'Failed to save note' },
      { status: err.status || 500 },
    )
  }
}
