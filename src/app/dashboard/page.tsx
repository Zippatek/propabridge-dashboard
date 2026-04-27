'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import {
  Calendar,
  FileText,
  ShieldCheck,
  ChevronRight,
  Shield,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { customer } from '@/lib/customer-api'
import { formatDateTime } from '@/lib/format'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface DealAppointment {
  id: string
  status?: string
  scheduled_for?: string
  date?: string
  time?: string
  property_id?: string
  property_title?: string
  property_address?: string
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER || '2348000000000'

/**
 * "My Deal" — the customer Deal Room.
 *
 * Replaces the marketplace-style overview (recommendations, saved listings)
 * with the only thing a high-touch property buyer cares about post-engagement:
 * what's the status of their active inspection, what docs are pending,
 * and where do they pick up the conversation with Propa.
 */
export default function DashboardPage() {
  const { data: session } = useSession()
  const firstName = (session?.user?.name || 'there').split(' ')[0]
  const kycStatus = (session?.user as { kyc_status?: string } | undefined)?.kyc_status || 'pending'

  const [nextInspection, setNextInspection] = useState<DealAppointment | null | undefined>(undefined)

  useEffect(() => {
    if (!session?.user?.id) return
    customer
      .get<{ items?: DealAppointment[]; data?: DealAppointment[] } | DealAppointment[]>(
        `/scheduler/appointments?user_id=${session.user.id}&limit=10`,
      )
      .then((v) => {
        const list = Array.isArray(v) ? v : v.items || v.data || []
        const upcoming = list
          .filter((a) => {
            const when = a.scheduled_for || a.date
            return when && new Date(when).getTime() > Date.now()
          })
          .sort((a, b) => {
            const ta = new Date(a.scheduled_for || a.date || 0).getTime()
            const tb = new Date(b.scheduled_for || b.date || 0).getTime()
            return ta - tb
          })[0]
        setNextInspection(upcoming || null)
      })
      .catch(() => setNextInspection(null))
  }, [session?.user?.id])

  return (
    <div className="space-y-8">
      {/* Hero — Continue on WhatsApp (Propa is the primary surface) */}
      <section className="relative overflow-hidden rounded-card animate-fade-up">
        <div className="absolute inset-0 gradient-navy-radial" />
        <div className="absolute inset-0">
          <Image
            src="/images/dashboard-hero-banner.jpg"
            alt=""
            fill
            className="object-cover mix-blend-soft-light opacity-40"
            priority
          />
        </div>
        <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-action/10 blur-2xl animate-float" />
        <div className="absolute bottom-4 right-24 w-14 h-14 rounded-full bg-gold/15 blur-xl animate-float-delayed" />

        <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-badge glass-dark text-[11px] font-semibold text-white/90 tracking-wide uppercase">
                <Shield size={12} strokeWidth={2} className="text-gold" />
                Verified Properties Only
              </div>
            </div>
            <h2 className="text-[32px] lg:text-[36px] font-bold text-white leading-[1.15] tracking-tight">
              Welcome back, {firstName}.
            </h2>
            <p className="text-[16px] text-white/75 mt-3 leading-relaxed">
              Propa is on WhatsApp. Continue your conversation, browse new matches, or
              book another viewing — all in one chat.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-7 py-3.5 rounded-button transition-all duration-200 flex items-center gap-2 whitespace-nowrap group shadow-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607z" />
              </svg>
              Continue on WhatsApp
              <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </a>
        </div>
      </section>

      {/* Next inspection — the single highest-value card on this page */}
      <section className="animate-fade-up animate-fade-up-2">
        <h3 className="text-h4 text-navy mb-3">Your next inspection</h3>
        {nextInspection === undefined ? (
          <div className="bg-white rounded-card border border-divider p-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : nextInspection === null ? (
          <div className="bg-white rounded-card border border-divider p-8 text-center">
            <Calendar size={32} strokeWidth={1.2} className="text-divider mx-auto mb-3" />
            <p className="text-body-sm text-subtle">
              No upcoming inspections. Chat with Propa to book one.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-action font-semibold text-body-sm hover:text-action-hover"
            >
              Open WhatsApp →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-divider p-6 shadow-card flex flex-col sm:flex-row gap-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-action via-action/60 to-transparent" />
            <div className="flex items-start gap-4 flex-1 pl-3">
              <div className="w-12 h-12 rounded-card bg-gold-light flex items-center justify-center flex-shrink-0 animate-float">
                <Calendar size={24} className="text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <p className="badge-text text-subtle uppercase tracking-wide">Confirmed</p>
                <h4 className="text-h4 text-navy mt-1">
                  {nextInspection.property_title || `Property ${nextInspection.property_id || ''}`}
                </h4>
                {nextInspection.property_address && (
                  <p className="flex items-center gap-1.5 text-caption text-subtle mt-1">
                    <MapPin size={14} strokeWidth={1.5} />
                    {nextInspection.property_address}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-body-sm text-action font-medium mt-3">
                  <Calendar size={14} strokeWidth={1.5} />
                  {formatDateTime(nextInspection.scheduled_for || nextInspection.date)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions — what you can actually DO from this dashboard */}
      <section className="animate-fade-up animate-fade-up-3">
        <h3 className="text-h4 text-navy mb-3">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            href="/dashboard/inspections"
            icon={Calendar}
            iconColor="text-action"
            iconBg="bg-action-light"
            title="My Inspections"
            body="Confirmed viewings, addresses, agent contact."
          />
          <ActionCard
            href="/dashboard/documents"
            icon={FileText}
            iconColor="text-gold"
            iconBg="bg-gold-light"
            title="Documents"
            body="Inspection reports, title docs, offer letters."
          />
          <ActionCard
            href="/dashboard/verification"
            icon={ShieldCheck}
            iconColor={kycStatus === 'verified' ? 'text-verified' : 'text-warning'}
            iconBg={kycStatus === 'verified' ? 'bg-verified-light' : 'bg-warning-light'}
            title="Verification"
            body={
              kycStatus === 'verified'
                ? 'Your KYC is approved.'
                : kycStatus === 'pending'
                  ? 'Submit ID + proof of address to close deals.'
                  : 'Action needed on your KYC submission.'
            }
            badge={
              kycStatus === 'verified' ? (
                <CheckCircle2 size={14} className="text-verified" />
              ) : kycStatus === 'pending' ? (
                <Clock size={14} className="text-warning" />
              ) : (
                <AlertCircle size={14} className="text-danger" />
              )
            }
          />
        </div>
      </section>
    </div>
  )
}

function ActionCard({
  href,
  icon: Icon,
  iconColor,
  iconBg,
  title,
  body,
  badge,
}: {
  href: string
  icon: typeof Calendar
  iconColor: string
  iconBg: string
  title: string
  body: string
  badge?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-card border border-divider p-5 shadow-card card-lift block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-card ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} strokeWidth={1.6} />
        </div>
        {badge}
      </div>
      <h4 className="text-h4 text-navy">{title}</h4>
      <p className="text-caption text-subtle mt-1 leading-relaxed">{body}</p>
      <p className="text-nav font-semibold text-action mt-3 group-hover:text-action-hover transition-colors flex items-center gap-1">
        Open <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </p>
    </a>
  )
}
