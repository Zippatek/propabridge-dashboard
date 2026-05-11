// lib/mock-data.ts

export interface Property {
  id: string;
  title: string;
  price: number;
  priceType: 'yearly' | 'total';
  bedrooms: number;
  bathrooms: number;
  size: string;
  location: string;
  neighborhood: string;
  type: 'rent' | 'sale';
  verified: boolean;
  images: string[];
  amenities: string[];
  builtYear?: number;
  floors?: number;
  parking?: string;
  description?: string;
  highlights?: string[];
  floorPlan?: {
    ground: { room: string; description: string }[];
    upper: { room: string; description: string }[];
  };
}

export let mockProperties: Property[] = [
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
 images: ['/images/property-lokogoma-1.jpg'],
 amenities: ['BQ', 'Generator', 'Borehole', 'Ample Parking', 'Private Garden'],
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
 images: ['/images/property-gwarinpa-1.jpg'],
 amenities: ['Generator', 'Borehole', 'Security', 'Parking'],
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
 images: ['/images/property-kaduna-1.jpg'],
 amenities: ['BQ', 'Swimming Pool', 'Generator', 'Borehole', 'Smart Gate'],
 },
]

export const getPropertyById = (id: string): Property | undefined => {
  return mockProperties.find(p => p.id === id);
};

export const updateProperty = (id: string, updatedData: Partial<Property>) => {
  mockProperties = mockProperties.map(p => 
    p.id === id ? { ...p, ...updatedData } : p
  );
};

export const mockUser = {
 name: 'Aminu Ibrahim',
 email: 'aminu@example.com',
 phone: '08012345678',
 savedProperties: ['PB-ABJ-0095', 'PB-ABJ-0096'],
 inspections: [
 {
 id: 'INS-001',
 propertyId: 'PB-ABJ-0095',
 date: '2026-04-15',
 time: '10:00 AM',
 confirmationNumber: 'CONF-20260415',
 status: 'upcoming',
 }
 ]
}
