// Shared types for automated verification checks run from the dashboard
// (document forensics, geo sanity, Google Open Buildings footprint).
//
// `severity` mirrors the backend findings table so that — when these checks
// are persisted server-side later — the same values flow through unchanged.

export type FindingSeverity = 'block' | 'flag' | 'info'

export type FindingState = 'pass' | 'fail' | 'inconclusive'

export interface ClientFinding {
  code: string
  severity: FindingSeverity
  state: FindingState
  message: string
  details?: Record<string, unknown>
}

export interface TitleDocExtraction {
  file_number: string | null
  plot_number: string | null
  holder_name: string | null
  issuing_authority: string | null
  issued_date: string | null
  title_type: string | null
  has_visible_stamp: boolean
  has_qr_code: boolean
  tampering_signals: string[]
  confidence: number
}

export interface TitleDocVerificationResult {
  extraction: TitleDocExtraction
  findings: ClientFinding[]
}

export interface FootprintCheckResult {
  polygon_area_m2: number | null
  buildings_inside_count: number
  total_footprint_area_m2: number
  coverage_ratio: number | null
  findings: ClientFinding[]
}
