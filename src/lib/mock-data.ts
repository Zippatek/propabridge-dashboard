/**
 * MIDDLEPARK MOCK DATA
 * For development and preview purposes
 * FOUNDATION.md Section 12
 */

export interface Property {
  id: string
  title: string
  price: number
  priceType: 'yearly' | 'total'
  bedrooms: number
  bathrooms: number
  size: string
  location: string
  neighborhood: string
  type: 'rent' | 'sale'
  verified: boolean
  images: string[]
  amenities: string[]
  // Extended detail fields
  description?: string
  highlights?: string[]
  builtYear?: number
  floors?: number
  parking?: string
  floorPlan?: {
    ground: { room: string; description: string }[]
    upper: { room: string; description: string }[]
  }
}

export interface Inspection {
  id: string
  propertyId: string
  date: string
  time: string
  confirmationNumber: string
  status: 'upcoming' | 'past'
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  savedProperties: string[]
  inspections: Inspection[]
}

export const mockProperties: Property[] = [
  {
    id: 'PB-ABJ-0095',
    title: '4-Bedroom Detached Duplex — Promenade Estate Cluster 7',
    price: 95000000,
    priceType: 'total',
    bedrooms: 4,
    bathrooms: 4,
    size: '400 SQM',
    location: 'Lokogoma, Abuja',
    neighborhood: 'Lokogoma',
    type: 'sale',
    verified: true,
    images: [
      '/images/property-lokogoma-1.jpg',
      '/images/property-interior-living.jpg',
      '/images/property-interior-kitchen.jpg',
      '/images/property-gwarinpa-1.jpg',
    ],
    amenities: [
      'Balcony', 'Terrace', 'Garden', 'Lush Green Lawn',
      'Private Rooftop Lounge', 'Fire Safety System', 'Smart Parking System',
      'Swimming Pool', 'Rooftop Garden', 'BQ', 'Generator', 'Borehole',
      'Ample Parking', 'Private Garden',
    ],
    description: '400 sqm. Fully detached. 4 bedrooms. 5 bathrooms. Green spaces. Recreational facilities. The Promenade Mall a short walk away. This is not the average duplex — it is one of the most generously sized standalone homes currently available in Lokogoma.\n\nPromenade Estate Cluster 7 is a serene, well-managed community with real infrastructure and real amenities. Verified by MiddlePark — title and physical inspection confirmed before listing.',
    highlights: [
      '4 bedrooms — all with bathroom access',
      '5 bathrooms — generous ratio for a 4-bed',
      '400 sqm — massive by duplex standards',
      'Fully detached — no shared walls, maximum privacy',
      '2-floor duplex configuration',
      'Ample on-plot parking',
      'Adjacent to The Promenade Mall — retail access from the estate',
      'Lokogoma — one of Abuja\'s most active and growing residential corridors',
    ],
    builtYear: 2025,
    floors: 2,
    parking: 'Ample — private driveway, detached compound',
    floorPlan: {
      ground: [
        { room: 'Main Living Room', description: 'Large open-plan living and dining area' },
        { room: 'Kitchen', description: 'Fitted kitchen — service access to rear' },
        { room: 'Study / Family Room', description: 'Flexible room — ground floor flex space' },
        { room: 'Visitor\'s Toilet', description: 'Ground floor WC' },
        { room: 'Parking', description: 'Ample — private driveway, detached compound' },
        { room: 'Outdoor Space', description: 'Private garden / rear yard — detached plot' },
      ],
      upper: [
        { room: 'Master Bedroom', description: 'Large master suite — ensuite bathroom' },
        { room: 'Bedroom 2', description: 'Ensuite or near-ensuite' },
        { room: 'Bedroom 3', description: 'Standard double — bathroom access' },
        { room: 'Bedroom 4', description: 'Standard double — bathroom access' },
      ],
    },
  },
  {
    id: 'PB-ABJ-0096',
    title: '3-Bedroom Flat — Gwarinpa Estate Phase 2',
    price: 2500000,
    priceType: 'yearly',
    bedrooms: 3,
    bathrooms: 3,
    size: '180 SQM',
    location: 'Gwarinpa, Abuja',
    neighborhood: 'Gwarinpa',
    type: 'rent',
    verified: true,
    images: [
      '/images/property-gwarinpa-1.jpg',
      '/images/property-interior-living.jpg',
      '/images/property-interior-kitchen.jpg',
    ],
    amenities: ['Generator', 'Borehole', 'Security', 'Parking', 'Garden'],
    description: 'A well-maintained 3-bedroom flat in the heart of Gwarinpa — Abuja\'s largest residential estate. Spacious rooms, modern finishes, and uninterrupted power supply. Close to schools, hospitals, and shopping centres.\n\nVerified by MiddlePark — title and physical inspection confirmed before listing.',
    highlights: [
      '3 bedrooms — all with ensuite bathrooms',
      '180 sqm — spacious open-plan layout',
      'Generator and borehole backup',
      '24/7 security — gated community',
      'Close to Gwarinpa Market and schools',
    ],
    builtYear: 2022,
    floors: 1,
    parking: 'Covered parking — 2 spaces',
    floorPlan: {
      ground: [
        { room: 'Living Room', description: 'Open-plan living and dining area' },
        { room: 'Kitchen', description: 'Fitted kitchen with pantry' },
        { room: 'Master Bedroom', description: 'Ensuite master with walk-in closet' },
        { room: 'Bedroom 2', description: 'Ensuite double bedroom' },
        { room: 'Bedroom 3', description: 'Standard double with shared bathroom' },
      ],
      upper: [],
    },
  },
  {
    id: 'PB-KD-0012',
    title: '5-Bedroom Duplex — Millennium City Estate',
    price: 180000000,
    priceType: 'total',
    bedrooms: 5,
    bathrooms: 5,
    size: '650 SQM',
    location: 'Babban Saura, Kaduna',
    neighborhood: 'Babban Saura',
    type: 'sale',
    verified: true,
    images: [
      '/images/property-kaduna-1.jpg',
      '/images/property-interior-living.jpg',
      '/images/property-interior-kitchen.jpg',
    ],
    amenities: ['BQ', 'Swimming Pool', 'Generator', 'Borehole', 'Smart Gate', 'Garden', 'Terrace'],
    description: 'A statement property in Kaduna\'s most exclusive gated community. 5 bedrooms, each ensuite, with a private swimming pool and BQ. Smart home-ready with automated security gate.\n\nMillennium City Estate offers 24/7 security, internal road infrastructure, and consistent power supply. Verified by MiddlePark.',
    highlights: [
      '5 ensuite bedrooms',
      'Private swimming pool',
      'Smart gate automation',
      'Boys\' quarters (BQ)',
      '650 sqm plot — generous compound',
      'Fully detached with perimeter fencing',
    ],
    builtYear: 2024,
    floors: 2,
    parking: 'Private garage — 3+ cars',
  },
  {
    id: 'PB-ABJ-0101',
    title: '4-Bedroom Villa — Maitama Diplomatic Zone',
    price: 250000000,
    priceType: 'total',
    bedrooms: 4,
    bathrooms: 5,
    size: '800 SQM',
    location: 'Maitama, Abuja',
    neighborhood: 'Maitama',
    type: 'sale',
    verified: true,
    images: [
      '/images/property-maitama-1.jpg',
      '/images/property-interior-living.jpg',
      '/images/property-interior-kitchen.jpg',
    ],
    amenities: ['BQ', 'Swimming Pool', 'Generator', 'Borehole', 'Garden', 'Security', 'Terrace', 'Balcony'],
    description: 'An architect-designed villa in the prestigious Maitama diplomatic zone. Expansive living spaces, landscaped gardens, and resort-level amenities. Walking distance to embassies, shops, and restaurants.\n\nVerified by MiddlePark — title and physical inspection confirmed before listing.',
    highlights: [
      '4 bedrooms — all ensuite with premium finishes',
      '5 bathrooms — including guest powder room',
      '800 sqm — one of the largest plots on the market',
      'Swimming pool and landscaped gardens',
      'Maitama — Abuja\'s most exclusive residential district',
    ],
    builtYear: 2023,
    floors: 2,
    parking: 'Covered garage — 4 cars + visitor parking',
  },
  {
    id: 'PB-ABJ-0105',
    title: '3-Bedroom Terrace — Jabi Lake Estate',
    price: 3500000,
    priceType: 'yearly',
    bedrooms: 3,
    bathrooms: 3,
    size: '220 SQM',
    location: 'Jabi, Abuja',
    neighborhood: 'Jabi',
    type: 'rent',
    verified: true,
    images: [
      '/images/property-jabi-1.jpg',
      '/images/property-interior-living.jpg',
    ],
    amenities: ['Generator', 'Security', 'Parking', 'Garden', 'Balcony'],
    description: 'A modern terrace duplex steps from Jabi Lake. Open-plan living with high ceilings, a private garden, and views of the lake. Ideal for young professionals and families.\n\nVerified by MiddlePark.',
    highlights: [
      '3 bedrooms — all ensuite',
      '220 sqm total area',
      'Lake-adjacent location',
      'Walking distance to Jabi Lake Mall',
    ],
    builtYear: 2024,
    floors: 2,
    parking: 'Covered — 2 spaces',
  },
  {
    id: 'PB-ABJ-0110',
    title: '2-Bedroom Apartment — Wuse 2 Central',
    price: 1800000,
    priceType: 'yearly',
    bedrooms: 2,
    bathrooms: 2,
    size: '120 SQM',
    location: 'Wuse 2, Abuja',
    neighborhood: 'Wuse',
    type: 'rent',
    verified: true,
    images: [
      '/images/property-lokogoma-1.jpg',
      '/images/property-interior-kitchen.jpg',
    ],
    amenities: ['Generator', 'Security', 'Parking'],
    description: 'A compact, well-finished 2-bedroom apartment in the commercial heart of Wuse 2. Close to restaurants, banks, and nightlife. Ideal for single professionals or couples.\n\nVerified by MiddlePark.',
    highlights: [
      '2 ensuite bedrooms',
      '120 sqm — efficient layout',
      'Central Wuse 2 location',
      '24/7 security and dedicated parking',
    ],
    builtYear: 2021,
    floors: 1,
    parking: 'Shared basement — 1 slot',
  },
]

export const mockUser: UserProfile = {
  name: 'Aminu Ibrahim',
  email: 'aminu@example.com',
  phone: '08012345678',
  savedProperties: ['PB-ABJ-0095', 'PB-ABJ-0096', 'PB-ABJ-0101'],
  inspections: [
    {
      id: 'INS-001',
      propertyId: 'PB-ABJ-0095',
      date: '2026-04-15',
      time: '10:00 AM',
      confirmationNumber: 'CONF-20260415',
      status: 'upcoming',
    },
    {
      id: 'INS-002',
      propertyId: 'PB-ABJ-0096',
      date: '2026-03-28',
      time: '2:00 PM',
      confirmationNumber: 'CONF-20260328',
      status: 'past',
    },
  ],
}

/**
 * Get property by ID
 */
export function getPropertyById(id: string): Property | undefined {
  return mockProperties.find((p) => p.id === id)
}

/**
 * Get saved properties for user
 */
export function getSavedProperties(): Property[] {
  return mockProperties.filter((p) => mockUser.savedProperties.includes(p.id))
}
