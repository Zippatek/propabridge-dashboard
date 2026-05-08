/**
 * Backend `properties.listing_type` is constrained to sale | rent.
 * Map legacy / UI aliases before PATCH/POST.
 */
export type ListingTypeDb = 'sale' | 'rent'

const RENT_ALIASES = new Set([
  'rent',
  'for_rent',
  'shortlet',
  'rental',
  'lease',
])

export function normalizeListingType(raw: string | null | undefined): ListingTypeDb {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (RENT_ALIASES.has(t)) return 'rent'
  return 'sale'
}

export const LISTING_TYPES_DB: ListingTypeDb[] = ['sale', 'rent']
