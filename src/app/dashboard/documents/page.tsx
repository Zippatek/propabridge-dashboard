'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FileText, Download, Upload, ShieldCheck } from 'lucide-react'
import { customer } from '@/lib/customer-api'
import { formatDateTime } from '@/lib/format'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui'

interface Doc {
  id: string
  type: string
  name?: string
  url?: string
  property_id?: string
  status?: string
  created_at?: string
}

export default function CustomerDocumentsPage() {
  const { data: session } = useSession()
  const [docs, setDocs] = useState<Doc[] | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    customer
      .get<{ items?: Doc[]; data?: Doc[] } | Doc[]>(
        `/api/documents?user_id=${session.user.id}`,
      )
      .then((v) => setDocs(Array.isArray(v) ? v : v.items || v.data || []))
      .catch(() => {
        // Endpoint not live yet (or zero docs) — fall through to the empty state.
        // Never show a scary error to a customer who just hasn't started a deal.
        setDocs([])
      })
  }, [session?.user?.id])

  if (docs === null) return <LoadingSpinner size="lg" />

  if (docs.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        body="When you book an inspection, the verified report, title docs, and offer letters for that property will land here."
        ctaLabel="Talk to Propa →"
        ctaHref={`https://wa.me/${process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348055551300'}`}
        illustration="house"
      />
    )
  }

  const grouped = docs.reduce<Record<string, Doc[]>>((acc, d) => {
    const key = d.property_id || 'General'
    ;(acc[key] = acc[key] || []).push(d)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([propId, items]) => (
        <section
          key={propId}
          className="bg-white rounded-card border border-divider shadow-card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-divider bg-beige/30 flex items-center justify-between">
            <h3 className="text-h4 text-navy">
              {propId === 'General' ? 'General' : `Property ${propId}`}
            </h3>
            <span className="text-caption text-subtle">
              {items.length} document{items.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="divide-y divide-divider">
            {items.map((d) => (
              <li key={d.id} className="px-6 py-4 flex items-center gap-4 hover:bg-beige/30">
                <div className="w-10 h-10 rounded-card bg-action-light text-action flex items-center justify-center flex-shrink-0">
                  {d.type === 'verification' ? (
                    <ShieldCheck size={20} strokeWidth={1.6} />
                  ) : (
                    <FileText size={20} strokeWidth={1.6} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{d.name || d.type}</p>
                  <p className="text-caption text-subtle">
                    {d.type} · {formatDateTime(d.created_at)}
                  </p>
                </div>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-action font-semibold text-body-sm bg-action-light px-3 py-1.5 rounded-button hover:bg-action hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Download size={14} strokeWidth={1.8} />
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="bg-white rounded-card border border-divider shadow-card p-6 flex items-start gap-3">
        <Upload size={18} className="text-action mt-0.5 flex-shrink-0" strokeWidth={1.8} />
        <div>
          <p className="font-semibold text-navy">Need to send us something?</p>
          <p className="text-body-sm text-subtle mt-1">
            Forward documents to Propa on WhatsApp, or upload them on the Verification page.
          </p>
        </div>
      </div>
    </div>
  )
}
