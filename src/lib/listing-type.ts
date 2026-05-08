/**
 * `properties.listing_type` CHECK constraint — keep aligned with
 * propabridge-backend: db/migrations/022_listing_type_constraint_and_units_available.sql
 */
export const LISTING_TYPES_ALLOWED_DB = [
  'sale',
  'rent',
  'shortlet',
  'for_sale',
  'for_rent',
  'off_plan',
  'commercial',
  'land',
  'rental',
  'lease',
] as const

export type ListingTypeAllowedDb = (typeof LISTING_TYPES_ALLOWED_DB)[number]

/** Values shown in admin/agency dropdowns (collapsed view). */
export type ListingTypeDb = 'sale' | 'rent'

const ALLOWED = new Set<string>(LISTING_TYPES_ALLOWED_DB)

/**
 * Map arbitrary inbound strings (including `transaction_type` labels like "For Rent")
 * to a CHECK-safe DB token. Returns null only when input is absent or blank.
 */
export function normalizeListingTypeForDb(
  raw: string | null | undefined,
): ListingTypeAllowedDb | null {
  if (raw === undefined || raw === null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  let s = trimmed.toLowerCase()
  s = s.replace(/[\u2013\u2014\u2212]/g, '-').replace(/\s+/g, ' ').trim()

  const slug = s.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  if (ALLOWED.has(slug)) return slug as ListingTypeAllowedDb

  if (slug.includes('shortlet') || slug.includes('short_let')) return 'shortlet'
  if (slug.includes('off_plan') || (slug.includes('off') && slug.includes('plan'))) return 'off_plan'
  if (slug.includes('commercial')) return 'commercial'
  if (slug === 'land') return 'land'

  const rentalLike =
    slug === 'rent' ||
    slug === 'rental' ||
    slug === 'lease' ||
    slug === 'for_rent' ||
    /\b(for\s+rent|to\s+rent)\b/.test(s) ||
    /\b(short\s*let|shortlet)\b/.test(s)

  if (rentalLike || (/\brent\b/.test(s) && !/\bfor\s+sale\b/.test(s) && !/\bresale\b/.test(s))) {
    return 'rent'
  }

  return 'sale'
}

/**
 * Admin/agency UI + outgoing PATCH from forms: collapse to sale | rent.
 * Blank/null becomes `sale` so selects stay controlled.
 */
export function normalizeListingType(raw: string | null | undefined): ListingTypeDb {
  const db = normalizeListingTypeForDb(raw)
  if (db === null) return 'sale'
  if (db === 'rent' || db === 'shortlet' || db === 'for_rent' || db === 'rental' || db === 'lease') {
    return 'rent'
  }
  return 'sale'
}

export const LISTING_TYPES_DB: ListingTypeDb[] = ['sale', 'rent']
