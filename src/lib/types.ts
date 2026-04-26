// Admin API response types

export interface OverviewKPIs {
  leads_total: number
  leads_week: number
  hot_leads: number
  bookings_total: number
  bookings_week: number
  listings_active: number
}

export interface FunnelCounts {
  total_leads: number
  with_intent: number
  with_location: number
  qualified: number
  booked: number
}

export interface SessionListItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  score: number | null
  intent: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AdkLead {
  id: string
  session_id?: string | null
  name?: string | null
  phone?: string | null
  email?: string | null
  score?: number | null
  intent?: string | null
  status?: string | null
  budget?: string | null
  property_type?: string | null
  location_preference?: string | null
  bedrooms?: number | null
  timeline?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  whatsapp_sent?: boolean | null
  [key: string]: unknown
}

export interface TranscriptTurn {
  author: 'user' | 'assistant'
  content: string
  timestamp: string | null
}

export interface ConversationDetail {
  lead: AdkLead
  transcript: TranscriptTurn[]
  appointments: BackendAppointment[]
}

export interface TemplateItem {
  name: string
  sid: string
  category: string
  display_name: string
}

export interface TemplateList {
  items: TemplateItem[]
  total: number
  categories: string[]
}

// propabridge-backend types

export interface BackendLead {
  id: string
  name?: string
  email?: string
  phone?: string
  intent?: string
  status?: string
  budget?: string
  property_id?: string
  message?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface BackendAppointment {
  id: string
  lead_id?: string
  property_id?: string
  status?: string
  scheduled_for?: string
  date?: string
  time?: string
  notes?: string
  created_at?: string
  [key: string]: unknown
}

export interface BackendListing {
  id: string
  title?: string
  price?: number
  location?: string
  city?: string
  bedrooms?: number
  bathrooms?: number
  type?: string
  verified?: boolean
  images?: string[]
  created_at?: string
  [key: string]: unknown
}
