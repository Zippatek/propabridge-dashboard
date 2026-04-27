'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Phone, MessageSquare } from 'lucide-react'
import { customer } from '@/lib/customer-api'
import { formatDateTime, statusClass } from '@/lib/format'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui'

const WHATSAPP = process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348000000000'

interface Appt {
  id: string
  status?: string
  scheduled_for?: string
  date?: string
  time?: string
  property_id?: string
  property_title?: string
  property_address?: string
  agent_name?: string
  agent_phone?: string
  notes?: string
}

export default function CustomerInspectionsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Appt[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!session?.user?.id) return
    setItems(null)
    setError(null)
    customer
      .get<{ items?: Appt[]; data?: Appt[] } | Appt[]>(
        `/scheduler/appointments?user_id=${session.user.id}&limit=100`,
      )
      .then((v) => setItems(Array.isArray(v) ? v : v.items || v.data || []))
      .catch((e) => setError((e as Error).message))
  }, [session?.user?.id])

  if (error) {
    return (
      <div className="bg-danger-light border border-danger/20 rounded-card p-6 text-danger">
        <p className="font-semibold">Couldn&apos;t load inspections</p>
        <p className="text-body-sm mt-1">{error}</p>
      </div>
    )
  }

  if (items === null) return <LoadingSpinner size="lg" />

  const now = Date.now()
  const filtered = items
    .filter((a) => {
      const when = a.scheduled_for || a.date
      if (!when) return scope === 'upcoming'
      const t = new Date(when).getTime()
      return scope === 'upcoming' ? t >= now : t < now
    })
    .sort((a, b) => {
      const ta = new Date(a.scheduled_for || a.date || 0).getTime()
      const tb = new Date(b.scheduled_for || b.date || 0).getTime()
      return scope === 'upcoming' ? ta - tb : tb - ta
    })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card border border-divider shadow-card p-1 inline-flex">
        {(['upcoming', 'past'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-5 py-2 rounded-button text-body-sm font-semibold capitalize transition-colors ${
              scope === s ? 'bg-action text-white' : 'text-subtle hover:bg-beige'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={scope === 'upcoming' ? 'No upcoming inspections' : 'No past inspections'}
          body={
            scope === 'upcoming'
              ? 'Chat with Propa on WhatsApp to schedule a viewing for a verified property.'
              : 'Inspections you complete will be archived here.'
          }
          ctaLabel="Talk to Propa →"
          ctaHref={`https://wa.me/${WHATSAPP}`}
          illustration="calendar"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-card border border-divider shadow-card p-6 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-action via-action/60 to-transparent" />
              <div className="pl-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="badge-text text-subtle uppercase tracking-wide">
                      {scope === 'upcoming' ? 'Confirmed' : 'Past'}
                    </p>
                    <h4 className="text-h4 text-navy mt-1 truncate">
                      {a.property_title || `Property ${a.property_id || ''}`}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-caption font-semibold flex-shrink-0 ${statusClass(a.status)}`}
                  >
                    {a.status || '—'}
                  </span>
                </div>

                {a.property_address && (
                  <p className="flex items-start gap-1.5 text-caption text-subtle">
                    <MapPin size={14} strokeWidth={1.5} className="mt-0.5 flex-shrink-0" />
                    {a.property_address}
                  </p>
                )}

                <p className="flex items-center gap-1.5 text-body-sm text-action font-medium">
                  <Calendar size={14} strokeWidth={1.5} />
                  {formatDateTime(a.scheduled_for || a.date)}
                </p>

                {(a.agent_name || a.agent_phone) && (
                  <div className="pt-3 border-t border-divider flex items-center gap-3">
                    <div className="text-body-sm text-navy flex-1">
                      <p className="font-semibold">{a.agent_name || 'Propabridge agent'}</p>
                      {a.agent_phone && (
                        <p className="text-caption text-subtle">{a.agent_phone}</p>
                      )}
                    </div>
                    {a.agent_phone && (
                      <a
                        href={`tel:${a.agent_phone}`}
                        className="p-2 rounded-button bg-action-light text-action hover:bg-action hover:text-white transition-colors"
                        aria-label="Call agent"
                      >
                        <Phone size={16} strokeWidth={1.8} />
                      </a>
                    )}
                    <a
                      href={`https://wa.me/${WHATSAPP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-button bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                      aria-label="WhatsApp Propa"
                    >
                      <MessageSquare size={16} strokeWidth={1.8} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
