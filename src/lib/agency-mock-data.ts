/**
 * Mock data for the Agency Portal to ensure the UI is reviewable 
 * before the backend endpoints are fully deployed.
 */

export const MOCK_OVERVIEW = {
  listings_active: 12,
  listings_pending: 3,
  leads_total: 148,
  leads_new: 7,
  inspections_upcoming: 5,
  inspections_completed: 42,
  commission_pending_ngn: 4500000,
  commission_paid_ngn: 12800000,
}

export const MOCK_LISTINGS = {
  items: [
    {
      id: '1',
      property_id: 'PB-ABJ-0095',
      title: 'Luxury 4 Bedroom Terrace',
      status: 'active',
      type: 'FOR SALE',
      price: '120,000,000',
      city: 'Abuja',
      neighborhood: 'Guzape',
      bedrooms: 4,
      bathrooms: 5,
      images: ['/images/property-guzape-1.jpg'],
      verified: true,
      featured: true,
      views: 1240,
      leads: 18,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      property_id: 'PB-ABJ-0102',
      title: 'Modern 3 Bedroom Apartment',
      status: 'active',
      type: 'FOR RENT',
      price: '4,500,000',
      city: 'Abuja',
      neighborhood: 'Maitama',
      bedrooms: 3,
      bathrooms: 4,
      images: ['/images/property-maitama-1.jpg'],
      verified: true,
      featured: false,
      views: 850,
      leads: 12,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      property_id: 'PB-ABJ-0088',
      title: '5 Bedroom Detached Duplex',
      status: 'pending',
      type: 'FOR SALE',
      price: '250,000,000',
      city: 'Abuja',
      neighborhood: 'Asokoro',
      bedrooms: 5,
      bathrooms: 6,
      images: [],
      verified: false,
      featured: false,
      views: 0,
      leads: 0,
      created_at: new Date().toISOString(),
    },
  ],
}

export const MOCK_LEADS = {
  items: [
    {
      id: 'L1',
      name: 'John Doe',
      phone: '08012345678',
      email: 'john@example.com',
      intent: 'BUY',
      budget: '150M',
      score: 85,
      status: 'new',
      property_title: 'Luxury 4 Bedroom Terrace',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'L2',
      name: 'Sarah Williams',
      phone: '09087654321',
      email: 'sarah@williams.com',
      intent: 'RENT',
      budget: '5M',
      score: 92,
      status: 'contacted',
      property_title: 'Modern 3 Bedroom Apartment',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

export const MOCK_INSPECTIONS = {
  items: [
    {
      id: 'I1',
      buyer_name: 'John Doe',
      property_title: 'Luxury 4 Bedroom Terrace',
      date: '2026-05-15',
      time: '10:30 AM',
      status: 'confirmed',
      agent_name: 'Adewale Musa',
    },
    {
      id: 'I2',
      buyer_name: 'Sarah Williams',
      property_title: 'Modern 3 Bedroom Apartment',
      date: '2026-05-16',
      time: '02:00 PM',
      status: 'pending',
      agent_name: 'Grace Eze',
    },
  ],
}

export const MOCK_COMMISSIONS = {
  items: [
    {
      id: 'C1',
      property_title: 'Semidetached Duplex in Lokogoma',
      buyer_name: 'Michael Chen',
      sale_price_ngn: 85000000,
      commission_rate: 0.05,
      commission_ngn: 4250000,
      status: 'paid',
      closing_date: '2026-04-10',
      paid_at: '2026-04-15',
    },
    {
      id: 'C2',
      property_title: '4 Bedroom Terrace in Guzape',
      buyer_name: 'John Doe',
      sale_price_ngn: 120000000,
      commission_rate: 0.05,
      commission_ngn: 6000000,
      status: 'in_escrow',
      closing_date: '2026-05-20',
    },
  ],
  summary: {
    total_paid_ngn: 12800000,
    total_in_escrow_ngn: 6000000,
    total_pending_ngn: 4500000,
    closings_count: 8,
  },
}

export const MOCK_PROFILE = {
  name: 'Zippatek Real Estate Agency',
  email: 'partnerships@zippatek.com',
  phone: '+234 805 555 1300',
  address: '123 Gwarinpa Estate, Abuja',
  commission_rate: 0.05,
  payout_bank: 'Access Bank',
  payout_account_number: '0123456789',
  payout_account_name: 'Zippatek Digital Ltd',
  status: 'active',
}
