'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Calendar, Eye, MessageCircle, MapPin, ChevronRight, Shield, Sparkles } from 'lucide-react'
import { StatCard, PropertyCard } from '@/components/ui'
import { mockProperties, mockUser, getPropertyById } from '@/lib/mock-data'

/**
 * Dashboard Overview Page
 * FOUNDATION.md Section 8.1
 */
export default function DashboardOverviewPage() {
  const upcomingInspection = mockUser.inspections.find((i) => i.status === 'upcoming')
  const inspectionProperty = upcomingInspection
    ? getPropertyById(upcomingInspection.propertyId)
    : null

  return (
    <div className="space-y-8">
      {/* ─── Welcome Banner ──────────────────────────── */}
      <section className="relative overflow-hidden rounded-card animate-fade-up">
        {/* Gradient background with radial accent */}
        <div className="absolute inset-0 gradient-navy-radial" />
        
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/dashboard-hero-banner.jpg"
            alt="Premium residential estate"
            fill
            className="object-cover mix-blend-soft-light opacity-40"
            priority
          />
        </div>

        {/* Animated decorative elements */}
        <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-action/10 blur-2xl animate-float" />
        <div className="absolute bottom-4 right-24 w-14 h-14 rounded-full bg-gold/15 blur-xl animate-float-delayed" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-badge glass-dark text-[11px] font-semibold text-white/90 tracking-wide uppercase">
                <Shield size={12} strokeWidth={2} className="text-gold" />
                Verified Properties Only
              </div>
            </div>
            <h2 className="text-[32px] lg:text-[36px] font-bold text-white leading-[1.15] tracking-tight">
              Good morning, {mockUser.name.split(' ')[0]} 👋
            </h2>
            <p className="text-[16px] text-white/70 mt-3 leading-relaxed">
              You have <span className="text-white font-semibold">{mockUser.savedProperties.length} properties</span> saved and{' '}
              <span className="text-white font-semibold">{mockUser.inspections.filter((i) => i.status === 'upcoming').length} inspection</span>{' '}
              booked.
            </p>
          </div>
          <Link href="/dashboard/saved">
            <button className="bg-action hover:bg-action-hover text-white font-semibold px-7 py-3.5 rounded-button transition-all duration-200 flex items-center gap-2 whitespace-nowrap animate-glow group">
              Browse Verified Listings 
              <ChevronRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </section>

      {/* ─── Quick Stats ─────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Heart}
            iconColor="#ffc870"
            iconBgColor="rgba(255, 200, 112, 0.12)"
            value={String(mockUser.savedProperties.length)}
            label="Properties saved"
            trend="+1 this week"
            delay={50}
          />
          <StatCard
            icon={Calendar}
            iconColor="#006aff"
            iconBgColor="rgba(0, 106, 255, 0.08)"
            value={String(mockUser.inspections.filter((i) => i.status === 'upcoming').length)}
            label="Upcoming visits"
            delay={100}
          />
          <StatCard
            icon={Eye}
            iconColor="#001a40"
            iconBgColor="#f0f4ff"
            value="12"
            label="Properties viewed"
            trend="+4 this week"
            delay={150}
          />
          <StatCard
            icon={MessageCircle}
            iconColor="#1a7a4a"
            iconBgColor="rgba(26, 122, 74, 0.08)"
            value="5"
            label="Propa conversations"
            delay={200}
          />
        </div>
      </section>

      {/* ─── Upcoming Inspection ─────────────────────── */}
      {upcomingInspection && inspectionProperty && (
        <section className="animate-fade-up animate-fade-up-3">
          <div className="bg-white rounded-card border border-[#e2e8f0] p-6 shadow-card card-lift flex flex-col sm:flex-row gap-6 relative overflow-hidden">
            {/* Subtle left accent gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-action via-action/60 to-transparent rounded-l-card" />

            <div className="flex items-start gap-4 flex-1 pl-3">
              <div className="w-12 h-12 rounded-card bg-gold-light flex items-center justify-center flex-shrink-0 animate-float">
                <Calendar size={24} className="text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <p className="badge-text text-subtle uppercase tracking-wide">
                  Upcoming Inspection
                </p>
                <h4 className="text-h4 text-navy mt-1">
                  {inspectionProperty.title}
                </h4>
                <p className="flex items-center gap-1.5 text-caption text-subtle mt-1">
                  <MapPin size={14} strokeWidth={1.5} />
                  {inspectionProperty.location}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-body-sm text-action font-medium">
                    <Calendar size={14} strokeWidth={1.5} />
                    {upcomingInspection.date} at {upcomingInspection.time}
                  </span>
                  <span className="text-caption text-subtle">
                    #{upcomingInspection.confirmationNumber}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:flex-col">
              <button className="bg-transparent border-[1.5px] border-navy text-navy font-semibold px-5 py-2 rounded-button text-body-sm hover:bg-beige transition-all duration-150">
                View on Map
              </button>
              <button className="text-body-sm font-medium text-subtle hover:text-navy transition-colors duration-150 px-5 py-2">
                Reschedule
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Recommended Properties ──────────────────── */}
      <section className="animate-fade-up animate-fade-up-4">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-h2 text-navy">Recommended for you</h2>
              <Sparkles size={18} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-body text-subtle mt-1">
              Based on your search history and saved preferences
            </p>
          </div>
          <Link
            href="/dashboard/saved"
            className="text-nav font-semibold text-action hover:text-action-hover transition-colors duration-150 hidden sm:flex items-center gap-1 group"
          >
            View all <ChevronRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProperties.slice(0, 3).map((property, i) => (
            <div key={property.id} className="animate-fade-up" style={{ animationDelay: `${300 + i * 80}ms` }}>
              <PropertyCard
                {...property}
                isSaved={mockUser.savedProperties.includes(property.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
