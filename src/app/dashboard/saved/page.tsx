'use client'

import { useState } from 'react'
import { PropertyCard, Badge, EmptyState } from '@/components/ui'
import { mockProperties, mockUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

const filterChips = [
  'All',
  'For Rent',
  'For Sale',
  'Abuja',
  'Kaduna',
  'Minna',
  'Under ₦3M',
  '3+ Bedrooms',
]

/**
 * Saved Properties Page
 * FOUNDATION.md Section 8.2
 */
export default function SavedPropertiesPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const savedProperties = mockProperties.filter((p) =>
    mockUser.savedProperties.includes(p.id)
  )

  const filteredProperties = savedProperties.filter((p) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'For Rent') return p.type === 'rent'
    if (activeFilter === 'For Sale') return p.type === 'sale'
    if (activeFilter === 'Abuja') return p.location.includes('Abuja')
    if (activeFilter === 'Kaduna') return p.location.includes('Kaduna')
    if (activeFilter === 'Under ₦3M') return p.price < 3000000
    if (activeFilter === '3+ Bedrooms') return p.bedrooms >= 3
    return true
  })

  return (
    <div className="space-y-6 animate-fade-up">
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-navy">Saved Properties</h1>
          <Badge variant="count">{savedProperties.length} properties</Badge>
        </div>
        <div className="relative">
          <select className="appearance-none px-4 py-2.5 pr-10 rounded-button border border-divider bg-white text-body-sm text-navy focus:outline-none focus:ring-2 focus:ring-action cursor-pointer shadow-sm hover:shadow transition-shadow duration-200">
            <option>Sort by: Date saved</option>
            <option>Sort by: Price (low)</option>
            <option>Sort by: Price (high)</option>
            <option>Sort by: Bedrooms</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
        </div>
      </div>

      {/* ─── Filter Chips ────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-badge text-body-sm font-medium transition-all duration-200',
                activeFilter === chip
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white text-subtle border border-divider hover:bg-navy hover:text-white hover:border-navy'
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Property Grid / Empty State ─────────────── */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property, i) => (
            <div 
              key={property.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <PropertyCard
                {...property}
                isSaved={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved properties yet"
          body="Browse verified listings and tap the heart to save properties you like."
          ctaLabel="Browse Listings →"
          ctaHref="/dashboard"
          illustration="house"
        />
      )}
    </div>
  )
}
