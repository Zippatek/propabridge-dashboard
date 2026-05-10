import type { AiListingAnswers } from '@/app/api/admin/ai-listing/route'

/** Normalise pasted header / label text for synonym lookup. */
function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[₦#]/g, '')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Strip thousands separators and non-digits from numeric-ish strings. */
function digitsOnly(s: string): string {
  return s.replace(/[^\d.]/g, '').replace(/^\.+/, '')
}

type SynMap = Record<string, keyof AiListingAnswers | 'amenities_csv' | 'is_estate_unit'>

const SYNONYMS: SynMap = {
  property: 'property_type',
  propertytype: 'property_type',
  type: 'property_type',
  category: 'property_type',
  listing: 'listing_type',
  listingtype: 'listing_type',
  transaction: 'listing_type',
  saleorrent: 'listing_type',
  intent: 'intent',
  bedrooms: 'bedrooms',
  beds: 'bedrooms',
  br: 'bedrooms',
  bathrooms: 'bathrooms',
  baths: 'bathrooms',
  ba: 'bathrooms',
  'built up': 'size_sqm',
  builtsqm: 'size_sqm',
  sizesqm: 'size_sqm',
  sqm: 'size_sqm',
  'built up area': 'size_sqm',
  builtup: 'size_sqm',
  'year built': 'year_built',
  yearbuilt: 'year_built',
  'built in': 'year_built',
  builtin: 'year_built',
  plotsize: 'declared_plot_size_sqm',
  'plot size': 'declared_plot_size_sqm',
  landsize: 'declared_plot_size_sqm',
  price: 'price',
  asking: 'price',
  amount: 'price',
  ngn: 'price',
  location: 'location',
  summary: 'location',
  address: 'address_line',
  'address line': 'address_line',
  street: 'address_line',
  city: 'city',
  neighborhood: 'neighborhood',
  neighbourhood: 'neighborhood',
  area: 'neighborhood',
  district: 'neighborhood',
  cadastral: 'cadastral_zone',
  'cadastral zone': 'cadastral_zone',
  'plot number': 'plot_number',
  plotno: 'plot_number',
  latitude: 'latitude',
  lat: 'latitude',
  longitude: 'longitude',
  lng: 'longitude',
  lon: 'longitude',
  geojson: 'polygon_geojson',
  polygon: 'polygon_geojson',
  'title type': 'title_type',
  titletype: 'title_type',
  'title file': 'title_file_no',
  'file no': 'title_file_no',
  fileno: 'title_file_no',
  'title holder': 'title_holder_name',
  holder: 'title_holder_name',
  'issued date': 'title_issued_date',
  'title issued': 'title_issued_date',
  'issuing authority': 'title_issuing_authority',
  authority: 'title_issuing_authority',
  'payment plan': 'payment_plan',
  'service charge': 'service_charge_ngn_per_year',
  commission: 'propabridge_commission_pct',
  attribution: 'attribution_window_months',
  'selling entity': 'selling_entity_type',
  'entity type': 'selling_entity_type',
  'legal name': 'selling_entity_legal_name',
  company: 'selling_entity_legal_name',
  developer: 'selling_entity_legal_name',
  cac: 'cac_rc_number',
  'rc number': 'cac_rc_number',
  power: 'power_supply',
  electricity: 'power_supply',
  water: 'water_supply',
  sewage: 'sewage',
  drainage: 'sewage',
  road: 'road_access',
  'road access': 'road_access',
  construction: 'construction_status',
  'construction status': 'construction_status',
  condition: 'condition',
  estate: 'estate_name',
  'estate name': 'estate_name',
  'estate unit': 'is_estate_unit',
  amenities: 'amenities_csv',
  facilities: 'amenities_csv',
  features: 'key_features',
  'key features': 'key_features',
  highlights: 'key_features',
  notes: 'additional_points',
  additional: 'additional_points',
  units: 'units_available',
  'units available': 'units_available',
}

function resolveField(rawKey: string): keyof AiListingAnswers | 'amenities_csv' | 'is_estate_unit' | null {
  const k = normKey(rawKey)
  if (SYNONYMS[k]) return SYNONYMS[k]
  for (const [needle, field] of Object.entries(SYNONYMS)) {
    if (k === needle || k.endsWith(` ${needle}`) || k.startsWith(`${needle} `)) return field
  }
  if (k.includes('bedroom')) return 'bedrooms'
  if (k.includes('bathroom')) return 'bathrooms'
  if (k.includes('neighbour') || k.includes('neighbor')) return 'neighborhood'
  if (k.includes('price') || k.includes('asking')) return 'price'
  return null
}

function coerceListingType(v: string): string {
  const s = normKey(v)
  if (s.includes('rent') || s.includes('lease') || s.includes('short let') || s.includes('shortlet')) return 'rent'
  return 'sale'
}

function coerceIntent(v: string): string {
  const s = normKey(v)
  if (s.includes('rent') || s.includes('lease')) return 'for_rent'
  if (s.includes('off plan') || s.includes('offplan')) return 'off_plan'
  return 'for_sale'
}

function coercePropertyType(v: string): string | null {
  const s = normKey(v).replace(/\s/g, '')
  const allowed = ['apartment', 'house', 'duplex', 'bungalow', 'land', 'commercial', 'villa', 'penthouse']
  for (const t of allowed) {
    if (s === t || s.includes(t)) return t
  }
  return null
}

function coerceSelect(
  value: string,
  allowed: readonly string[],
): string | null {
  const v = normKey(value).replace(/\s+/g, '_')
  if (allowed.includes(value)) return value
  for (const o of allowed) {
    if (!o) continue
    if (v === normKey(o).replace(/\s+/g, '_')) return o
    if (normKey(value).includes(normKey(o))) return o
  }
  return null
}

export interface ParsePasteResult {
  patch: Partial<AiListingAnswers>
  /** Labels we could not map (for UI feedback). */
  unknownKeys: string[]
}

/**
 * Parse pasted spreadsheet row, TSV, or `Label: value` lines into partial answers.
 */
export function parseListingPasteFromText(raw: string): ParsePasteResult {
  const unknownKeys: string[] = []
  const patch: Partial<AiListingAnswers> = {}

  const text = raw.trim()
  if (!text) return { patch, unknownKeys }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  // Two-row TSV: header line + value line (Excel copy)
  if (lines.length >= 2 && lines[0].includes('\t') && lines[1].includes('\t')) {
    const headers = lines[0].split('\t').map(c => c.trim())
    const values = lines[1].split('\t').map(c => c.trim())
    const max = Math.min(headers.length, values.length)
    for (let i = 0; i < max; i++) {
      applyPair(headers[i], values[i], patch, unknownKeys)
    }
    return { patch, unknownKeys }
  }

  for (const line of lines) {
    if (line.includes('\t')) {
      const parts = line.split('\t').map(p => p.trim())
      if (parts.length >= 2) {
        const key = parts[0]
        const val = parts.slice(1).join('\t')
        applyPair(key, val, patch, unknownKeys)
      }
      continue
    }
    const pipe = line.split('|').map(p => p.trim())
    if (pipe.length >= 2 && pipe[0] && !line.includes('http')) {
      applyPair(pipe[0], pipe.slice(1).join(' | '), patch, unknownKeys)
      continue
    }
    const m = line.match(/^([^:=]{1,80})[:=]\s*(.+)$/)
    if (m) {
      applyPair(m[1].trim(), m[2].trim(), patch, unknownKeys)
      continue
    }
  }

  return { patch, unknownKeys }
}

function applyPair(rawKey: string, rawVal: string, patch: Partial<AiListingAnswers>, unknownKeys: string[]) {
  const val = rawVal.trim()
  if (!val) return
  const field = resolveField(rawKey)
  if (!field) {
    unknownKeys.push(rawKey)
    return
  }

  if (field === 'amenities_csv') {
    const list = val.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
    patch.amenities = [...(patch.amenities || []), ...list]
    return
  }

  if (field === 'is_estate_unit') {
    const s = normKey(val)
    patch.is_estate_unit = s === 'yes' || s === 'true' || s === '1' || s === 'y'
    return
  }

  switch (field) {
    case 'listing_type':
      patch.listing_type = coerceListingType(val)
      break
    case 'intent':
      patch.intent = coerceIntent(val)
      break
    case 'property_type': {
      const t = coercePropertyType(val)
      if (t) patch.property_type = t
      break
    }
    case 'bedrooms':
    case 'bathrooms':
      patch[field] = digitsOnly(val) || val
      break
    case 'price':
    case 'service_charge_ngn_per_year':
    case 'propabridge_commission_pct':
    case 'attribution_window_months':
    case 'size_sqm':
    case 'year_built':
    case 'declared_plot_size_sqm':
    case 'units_available':
      patch[field] = digitsOnly(val) || val.replace(/,/g, '')
      break
    case 'power_supply':
      patch.power_supply =
        coerceSelect(val, ['', 'grid', 'grid_inverter', 'solar', 'generator_only', 'none']) ?? val
      break
    case 'water_supply':
      patch.water_supply = coerceSelect(val, ['', 'mains', 'borehole', 'none']) ?? val
      break
    case 'sewage':
      patch.sewage = coerceSelect(val, ['', 'mains', 'septic', 'soakaway']) ?? val
      break
    case 'road_access':
      patch.road_access = coerceSelect(val, ['', 'tarred', 'graded', 'untarred', 'seasonal']) ?? val
      break
    case 'construction_status':
      patch.construction_status =
        coerceSelect(val, ['', 'finished', 'semi_finished', 'under_construction', 'off_plan', 'plots']) ?? val
      break
    case 'condition':
      patch.condition = coerceSelect(val, ['', 'new', 'renovated', 'existing']) ?? val
      break
    case 'payment_plan':
      patch.payment_plan =
        coerceSelect(val, ['outright', 'installment', 'mortgage', 'off_plan_milestones']) ?? val
      break
    case 'selling_entity_type':
      patch.selling_entity_type =
        coerceSelect(val, ['developer', 'agent', 'owner_direct', 'cooperative', 'subsidiary']) ?? val
      break
    case 'title_type': {
      const s = normKey(val)
      let t: string | null = null
      if (s.includes('c of o') || s.includes('certificate of occup')) t = 'c_of_o'
      else if (s.includes('right of occup') || s.includes(' r of o')) t = 'r_of_o'
      else if (s.includes('governor')) t = 'governors_consent'
      else if (s.includes('deed of assign')) t = 'deed_of_assignment'
      else if (s.includes('customary')) t = 'customary'
      else if (s.includes('allocation')) t = 'allocation_letter'
      else
        t = coerceSelect(val, [
          '',
          'c_of_o',
          'r_of_o',
          'governors_consent',
          'deed_of_assignment',
          'customary',
          'allocation_letter',
        ])
      if (t) patch.title_type = t
      break
    }
    default:
      ;(patch as Record<string, unknown>)[field] = val
      break
  }
}

export function mergeParsedIntoAnswers(
  base: AiListingAnswers,
  parsed: ParsePasteResult,
): AiListingAnswers {
  const next: AiListingAnswers = { ...base, ...parsed.patch }
  if (parsed.patch.amenities?.length) {
    next.amenities = Array.from(new Set([...(base.amenities || []), ...parsed.patch.amenities]))
  }
  next.listing_type = coerceListingType(next.listing_type || 'sale')
  const allowedPt = [
    'apartment',
    'house',
    'duplex',
    'bungalow',
    'land',
    'commercial',
    'villa',
    'penthouse',
  ] as const
  if (!allowedPt.includes(next.property_type as (typeof allowedPt)[number])) {
    next.property_type = base.property_type
  }
  return next
}
