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
  full_name?: string | null
  profile_name?: string | null
  phone: string | null
  email: string | null
  score: number | null
  intent: string | null
  relationship_stage?: string | null
  next_best_action?: string | null
  risk_of_churn?: number | null
  created_at: string | null
  updated_at: string | null
}

export interface UserRelationshipProfile {
  id: string
  user_id: string
  active_session_id: string
  lead_id?: string | null
  channel?: string | null
  phone?: string | null
  profile_name?: string | null
  assigned_agent_name?: string | null
  relationship_stage?: string | null
  intent?: string | null
  budget?: string | null
  property_type?: string | null
  bedrooms?: number | null
  preferred_locations?: unknown[] | Record<string, unknown> | null
  timeline?: string | null
  relationship_summary?: string | null
  next_best_action?: string | null
  next_followup_at?: string | null
  followup_cadence_days?: number | null
  engagement_score?: number | null
  conversion_score?: number | null
  risk_of_churn?: number | null
  last_user_message_at?: string | null
  last_agent_message_at?: string | null
  last_contacted_at?: string | null
  suppress_memory_until?: string | null
  reset_count?: number | null
  opted_out?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  metadata?: Record<string, unknown> | null
  notes?: UserRelationshipNote[] | null
}

export interface UserRelationshipNote {
  id: string
  profile_id: string
  user_id: string
  content: string
  author_type: 'human' | 'ai'
  author_id?: string | null
  reason?: string | null
  created_at: string
  updated_at: string
}

/** Heuristic pre-waitlist row from GET /leads/waitlist-candidates */
export interface WaitlistCandidate {
  session_id: string
  phone?: string | null
  lead_name?: string | null
  last_message_at?: string | null
  reasons: string[]
  score: number
  snippet: string
}

export interface AdkLead {
  id: string
  session_id?: string | null
  name?: string | null
  full_name?: string | null
  profile_name?: string | null
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
  /** e.g. chat_heuristic after admin promote from Likely tab */
  waitlist_source?: string | null
  /** Populated when the row was seeded from ai_promises backfill */
  waitlist_source_promise_id?: string | null
  waitlist_criteria?: Record<string, unknown> | null
  last_waitlist_notify_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  whatsapp_sent?: boolean | null
  [key: string]: unknown
}

export interface TranscriptTurn {
  author: 'user' | 'assistant' | 'agent'
  content: string
  timestamp: string | null
}

export interface TakeoverStatus {
  is_taken_over: boolean
  /** ADK synonym for `is_taken_over` */
  active?: boolean
  /** ISO takeover timestamp(s) — server may populate `updated_at` or `taken_over_at` */
  taken_over_by?: string | null
  taken_over_at?: string | null
  updated_at?: string | null
  auto_sent?: boolean
}

export interface ConversationDetail {
  lead: AdkLead
  relationship?: UserRelationshipProfile | null
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
  listing_id?: string
  agency_name?: string
  status?: string
  scheduled_for?: string
  scheduled_at?: string
  date?: string
  time?: string
  notes?: string
  created_at?: string
  [key: string]: unknown
}

export interface Agency {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  status: 'active' | 'paused' | 'suspended' | 'invited'
  commission_rate: number
  listings_count: number
  closings_count: number
  created_at: string
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

export interface AdminListing {
  id: string
  title?: string
  slug?: string
  city?: string
  listing_type?: string
  property_type?: string
  bedrooms?: number | null
  bathrooms?: number | null
  size_sqm?: number | null
  price?: number | null
  previous_price?: number | null
  cover_image_url?: string | null
  featured?: boolean
  verification_status?: string
  agency_name?: string
  agency_id?: string
  created_at?: string
  updated_at?: string
  // Extended structured fields surfaced in the Edit drawer.
  description?: string | null
  neighborhood?: string | null
  address?: string | null
  payment_plan?: string | null
  service_charge_ngn_per_year?: number | null
  propabridge_commission_pct?: number | null
  attribution_window_months?: number | null
  selling_entity_type?: string | null
  selling_entity_legal_name?: string | null
  cac_rc_number?: string | null
  power_supply?: string | null
  water_supply?: string | null
  sewage?: string | null
  road_access?: string | null
  is_estate_unit?: boolean | null
  estate_name?: string | null
  construction_status?: string | null
  condition?: string | null
  built_up_area_sqm?: number | null
  declared_plot_size_sqm?: number | null
  intent?: string | null
  amenities?: string[] | null
  images?: string[] | null
  units_available?: number | null
  year_built?: number | null
  cadastral_zone?: string | null
  plot_number?: string | null
  latitude?: number | null
  longitude?: number | null
  polygon_geojson?: string | null
  title_type?: string | null
  title_file_no?: string | null
  title_holder_name?: string | null
  title_issued_date?: string | null
  title_issuing_authority?: string | null
}

export interface AdkListing {
  id: string
  title?: string
  description?: string
  city?: string
  bedrooms?: number
  bathrooms?: number
  price?: number
  listing_type?: string
  property_type?: string
  size_sqm?: number
  cover_image_url?: string
  slug?: string
  featured?: boolean
  year_built?: string
  created_at?: string
  updated_at?: string
  previous_price?: number
  [key: string]: unknown
}

export interface AdkPromise {
  id: string
  created_at: string
  session_id: string
  lead_phone?: string | null
  lead_name?: string | null
  promise_text: string
  detected_keywords?: string[]
  is_explicit?: boolean
  status: 'open' | 'resolved'
  resolved_at?: string | null
  resolved_by?: string | null
  notes?: string | null
}

export interface AdkAgent {
  id: string
  name: string
  description: string
  category: string
  status: 'active' | 'running' | 'paused' | 'error'
  schedule?: string | null
  last_run?: string | null
  last_result?: string | null
  tools_used?: string[]
  icon?: string
}

export interface RewriteResult {
  description: string
  summary: string
  search_keywords: string[]
  before: { description: string }
}
