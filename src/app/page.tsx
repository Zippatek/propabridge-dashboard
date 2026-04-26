'use client'

import { Heart, Calendar, Eye, MessageCircle, ChevronRight, Zap, Droplets, ParkingCircle, TreePine, Home as HomeIcon, Shield, Fence } from 'lucide-react'
import { Button, PropertyCard, StatCard, AmenityChip, Badge, EmptyState, LoadingSpinner } from '@/components/ui'
import { mockProperties } from '@/lib/mock-data'

/**
 * Phase 1 — Foundation Preview Page
 * Displays all UI components for verification before proceeding to Phase 2
 */
export default function FoundationPreview() {
  return (
    <div className="min-h-screen bg-beige">
      {/* ─── Header ──────────────────────────────────── */}
      <header className="bg-white border-b border-divider sticky top-0 z-50">
        <div className="max-w-dashboard mx-auto px-6 h-18 flex items-center justify-between">
          <div className="text-h4">
            <span className="font-bold text-navy">PROPA</span>
            <span className="font-bold text-action">BRIDGE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <span className="text-nav uppercase text-navy">Listings</span>
            <span className="text-nav uppercase text-navy">About</span>
            <span className="text-nav uppercase text-navy">Contact</span>
          </nav>
          <button className="bg-navy text-white px-5 py-2.5 rounded-button text-nav font-semibold flex items-center gap-2">
            CHAT WITH PROPA <ChevronRight size={14} />
          </button>
        </div>
      </header>

      <main className="max-w-dashboard mx-auto px-6 py-12">
        {/* ─── Section: Buttons ──────────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Buttons</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">
              Browse Listings <ChevronRight size={14} />
            </Button>
            <Button variant="secondary">
              View Details <ChevronRight size={14} />
            </Button>
            <Button variant="ghost">Filter</Button>
            <Button variant="danger">Cancel</Button>
            <Button variant="primary" isLoading>
              Signing in...
            </Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </section>

        {/* ─── Section: Badges ───────────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Badges</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="sale">FOR SALE</Badge>
            <Badge variant="rent">FOR RENT</Badge>
            <Badge variant="status">Verified</Badge>
            <Badge variant="count">12 properties</Badge>
          </div>
        </section>

        {/* ─── Section: Amenity Chips ────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Amenity Chips</h2>
          <div className="flex flex-wrap gap-2">
            <AmenityChip icon={Zap} label="Generator" />
            <AmenityChip icon={Droplets} label="Borehole" />
            <AmenityChip icon={ParkingCircle} label="Parking" />
            <AmenityChip icon={TreePine} label="Garden" />
            <AmenityChip icon={HomeIcon} label="BQ" />
            <AmenityChip icon={Shield} label="Security" />
            <AmenityChip icon={Fence} label="Swimming Pool" />
          </div>
        </section>

        {/* ─── Section: Stat Cards ─────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Stat Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Heart}
              iconColor="#ffc870"
              iconBgColor="rgba(255, 200, 112, 0.15)"
              value="3"
              label="Properties saved"
              trend="+1 this week"
            />
            <StatCard
              icon={Calendar}
              iconColor="#006aff"
              iconBgColor="rgba(0, 106, 255, 0.1)"
              value="1"
              label="Upcoming visits"
            />
            <StatCard
              icon={Eye}
              iconColor="#001a40"
              iconBgColor="#f0f4ff"
              value="12"
              label="This month"
            />
            <StatCard
              icon={MessageCircle}
              iconColor="#1a7a4a"
              iconBgColor="rgba(26, 122, 74, 0.1)"
              value="5"
              label="Total chats"
            />
          </div>
        </section>

        {/* ─── Section: Property Cards ──────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Property Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.slice(0, 3).map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                isSaved={property.id === 'PB-ABJ-0095'}
              />
            ))}
          </div>
        </section>

        {/* ─── Section: Empty State ─────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Empty States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-card p-8">
              <EmptyState
                title="No saved properties yet"
                body="Browse verified listings and tap the heart to save properties you like."
                ctaLabel="Browse Listings →"
                ctaHref="/dashboard"
                illustration="house"
              />
            </div>
            <div className="bg-white rounded-card p-8">
              <EmptyState
                title="No inspections booked yet"
                body="Find a property you like and book a free inspection."
                ctaLabel="Find a Property →"
                ctaHref="/dashboard"
                illustration="calendar"
              />
            </div>
            <div className="bg-white rounded-card p-8">
              <EmptyState
                title="Start chatting with Propa"
                body="Ask Propa to find verified properties that match what you need."
                ctaLabel="Chat with Propa →"
                ctaHref="/dashboard/chat"
                illustration="chat"
              />
            </div>
          </div>
        </section>

        {/* ─── Section: Loading ──────────────────────── */}
        <section className="mb-12">
          <h2 className="text-h2 text-navy mb-6">Loading</h2>
          <div className="bg-white rounded-card p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </section>

        {/* ─── Footer ────────────────────────────────── */}
        <footer className="mt-16 pt-8 border-t border-divider text-center">
          <p className="text-caption text-subtle">
            Phase 1 — Foundation Preview · Propabridge Dashboard · Zippatek Digital Ltd
          </p>
        </footer>
      </main>
    </div>
  )
}
