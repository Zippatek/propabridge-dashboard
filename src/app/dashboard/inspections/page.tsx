'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Calendar, MapPin, Star, ChevronRight, Clock, CheckCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { mockUser, getPropertyById } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

/**
 * Inspections Page
 * FOUNDATION.md Section 8.3
 */
export default function InspectionsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const upcomingInspections = mockUser.inspections.filter(
    (i) => i.status === 'upcoming'
  )
  const pastInspections = mockUser.inspections.filter(
    (i) => i.status === 'past'
  )

  const inspections =
    activeTab === 'upcoming' ? upcomingInspections : pastInspections

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <h1 className="text-h1 text-navy">Inspections</h1>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-badge bg-action/8 text-[12px] font-semibold text-action">
          <Clock size={12} strokeWidth={2} />
          {upcomingInspections.length} upcoming
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────── */}
      <div className="flex gap-1 bg-white rounded-button p-1 w-fit border border-divider shadow-sm">
        {(['upcoming', 'past'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-2.5 rounded-button text-body-sm font-medium transition-all duration-200 capitalize relative',
              activeTab === tab
                ? 'bg-navy text-white shadow-sm'
                : 'text-subtle hover:text-navy hover:bg-beige/50'
            )}
          >
            {tab}
            {tab === 'upcoming' && upcomingInspections.length > 0 && activeTab !== tab && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-action" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Inspection Cards ────────────────────────── */}
      {inspections.length > 0 ? (
        <div className="space-y-4">
          {inspections.map((inspection, i) => {
            const property = getPropertyById(inspection.propertyId)
            if (!property) return null

            return (
              <div
                key={inspection.id}
                className={cn(
                  'bg-white rounded-card p-5 shadow-card card-lift flex flex-col sm:flex-row gap-5 animate-fade-up relative overflow-hidden',
                  activeTab === 'upcoming'
                    ? 'border-l-4 border-l-action'
                    : 'border-l-4 border-l-divider'
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Thumbnail with overlay */}
                <div className="w-full sm:w-24 h-36 sm:h-24 rounded-container overflow-hidden flex-shrink-0 relative group">
                  <Image
                    src={property.images[0] || ''}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {activeTab === 'upcoming' && (
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/20 transition-colors duration-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-h4 text-navy truncate">
                    {property.title}
                  </h4>
                  <p className="flex items-center gap-1.5 text-caption text-subtle mt-1">
                    <MapPin size={14} strokeWidth={1.5} />
                    {property.location}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-2.5">
                    <span className={cn(
                      'flex items-center gap-1.5 text-body-sm font-medium px-3 py-1 rounded-badge',
                      activeTab === 'upcoming' 
                        ? 'bg-action/8 text-action' 
                        : 'bg-beige text-subtle'
                    )}>
                      <Calendar size={14} strokeWidth={1.5} />
                      {inspection.date} at {inspection.time}
                    </span>
                    <span className="text-caption text-subtle flex items-center gap-1">
                      <CheckCircle size={12} strokeWidth={1.5} />
                      #{inspection.confirmationNumber}
                    </span>
                  </div>

                  {/* Rating — past inspections only */}
                  {activeTab === 'past' && (
                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-caption text-subtle mr-2">Rate this property</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="group transition-transform duration-150 hover:scale-110">
                          <Star
                            size={18}
                            strokeWidth={1.5}
                            className="text-gold group-hover:fill-gold transition-all duration-200"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-3 flex-shrink-0">
                  <button className="bg-transparent border-[1.5px] border-navy text-navy font-semibold px-4 py-2 rounded-button text-body-sm hover:bg-navy hover:text-white transition-all duration-200 flex items-center gap-1 group">
                    View Property <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  {activeTab === 'upcoming' && (
                    <button className="text-body-sm font-medium text-subtle hover:text-danger transition-colors duration-150 px-4 py-2">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No inspections booked yet"
          body="Find a property you like and book a free inspection."
          ctaLabel="Find a Property →"
          ctaHref="/dashboard/saved"
          illustration="calendar"
        />
      )}
    </div>
  )
}
