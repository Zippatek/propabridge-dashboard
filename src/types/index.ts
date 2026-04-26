// ─────────────────────────────────────────────────────────────────────────────
// PROPABRIDGE DASHBOARD — TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type PropertyType = 'rent' | 'sale'
export type PropertyStatus = 'verified' | 'pending' | 'hold'
export type InspectionStatus = 'upcoming' | 'completed' | 'cancelled'
export type UserIntent = 'rent' | 'buy' | 'invest' | 'unknown'

export interface Property {
  id: string                    // e.g. "PB-ABJ-0095"
  title: string
  price: number
  priceType: 'yearly' | 'total'
  bedrooms: number
  bathrooms: number
  parking?: number
  size: string                  // e.g. "400 SQM"
  location: string              // Full address display
  neighborhood: string          // e.g. "Gwarinpa"
  city: 'Abuja' | 'Kaduna' | 'Minna'
  type: PropertyType
  status: PropertyStatus
  verified: boolean
  images: string[]
  amenities: string[]
  description?: string
  floorPlan?: FloorPlanSection[]
  agent?: AgentInfo
  coordinates?: { lat: number; lng: number }
  listedAt: string              // ISO date string
}

export interface FloorPlanSection {
  floor: string                 // e.g. "Ground Floor (Typical Layout)"
  rooms: { name: string; description: string }[]
}

export interface AgentInfo {
  name: string                  // Always "Propabridge Team" — never developer name
  email: string
  phone: string
  avatar?: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string                 // WhatsApp number
  avatar?: string
  savedProperties: string[]     // Array of Property IDs
  createdAt: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  intent: UserIntent
  budgetMin?: number
  budgetMax?: number
  preferredAreas: string[]
  minBedrooms?: number
  propertyTypes: PropertyType[]
}

export interface Inspection {
  id: string
  propertyId: string
  property?: Property           // Populated on fetch
  userId: string
  date: string                  // ISO date string
  time: string                  // e.g. "10:00 AM"
  confirmationNumber: string    // e.g. "CONF-20260415"
  status: InspectionStatus
  notes?: string
  rating?: number               // 1–5, set after inspection
}

export interface ChatMessage {
  id: string
  role: 'user' | 'propa'
  content: string
  timestamp: string
  propertiesFound?: Property[]  // Propa may return property results
}

export interface ChatSession {
  id: string                    // e.g. "sess_xxxxx"
  userId?: string
  messages: ChatMessage[]
  stage: 'greeting' | 'discovery' | 'searching' | 'captured' | 'viewing_booked' | 'followup'
  dataExtracted: {
    name?: string
    phone?: string
    email?: string
    budget?: string
    bedrooms?: number
    locationPreference?: string
    intent?: UserIntent
    viewingRequested?: boolean
    urgency?: 'hot' | 'warm' | 'cold'
  }
  createdAt: string
  updatedAt: string
}

// ─── UI COMPONENT PROPS ──────────────────────────────────────────────────────

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  fullWidth?: boolean
}

export interface PropertyCardProps {
  property: Property
  isSaved?: boolean
  onSave?: (id: string) => void
  onUnsave?: (id: string) => void
  compact?: boolean
}

export interface StatCardProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  iconBgColor: string
  iconColor: string
  value: string | number
  label: string
  trend?: string
  trendPositive?: boolean
}

export interface EmptyStateProps {
  illustration: 'house' | 'calendar' | 'chat' | 'search'
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

// ─── API RESPONSE TYPES ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PropertySearchFilters {
  type?: PropertyType
  city?: string
  neighborhood?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  amenities?: string[]
  propertyType?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
