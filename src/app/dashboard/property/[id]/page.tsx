'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Tag, Wallet, Bed, Bath, Maximize2, CalendarDays, Layers, Car,
  Hash, MapPin, ChevronRight, ArrowLeft, Heart, Share2,
  Mail, Phone, CheckCircle, Copy, Play,
  Fence, Trees, Waves, ShowerHead, Flame, ParkingCircle,
  Wifi, Shield, Zap, Info, User
} from 'lucide-react'
import { getPropertyById, mockProperties } from '@/lib/mock-data'
import { formatPrice } from '@/lib/utils'
import { PropertyCard } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// Amenity icon mapping
const amenityIcons: Record<string, React.ElementType> = {
  'Balcony': Fence,
  'Terrace': Layers,
  'Garden': Trees,
  'Lush Green Lawn': Trees,
  'Private Rooftop Lounge': Layers,
  'Fire Safety System': Flame,
  'Smart Parking System': ParkingCircle,
  'Swimming Pool': Waves,
  'Rooftop Garden': Trees,
  'BQ': Bed,
  'Generator': Zap,
  'Borehole': ShowerHead,
  'Ample Parking': Car,
  'Private Garden': Trees,
  'Security': Shield,
  'Parking': Car,
  'Smart Gate': Shield,
  'Near subway': MapPin,
  'Lake View': Waves,
  'Laundry/washer': ShowerHead,
  'Near train station': MapPin,
  'Covered parking': Car,
  'Wifi': Wifi,
}

/**
 * Property Details Page 
 * Adapted to exactly match the Propabridge branding layout 
 * (Full width edge-to-edge hero, separated title underneath,
 * Spec grid grouped into top/bottom without lines, custom layout grids).
 */
export default function PropertyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const property = getPropertyById(id)
  const [copied, setCopied] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  if (!property) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-[40px] text-navy mb-2 tracking-tight font-bold">Property not found</h2>
          <p className="text-[16px] text-subtle mb-8">
            This listing may have been removed or the ID is incorrect.
          </p>
          <Link href="/dashboard/saved">
            <Button variant="primary">
              <ArrowLeft size={16} /> Back to Listings
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(property.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedPrice = formatPrice(property.price, property.priceType)

  return (
    <div className="w-full bg-[#f4f3ea] min-h-screen pb-20">
      
      {/* ─── Edge-to-Edge Hero Image ────────────────────────────── */}
      <section className="relative w-full h-[550px] lg:h-[650px] overflow-hidden -mt-[80px]" data-cursor="view">
        <Image
          src={property.images[activeImage] || property.images[0]}
          alt={property.title}
          fill
          className="object-cover"
          priority
        />
        {/* Soft fading base */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f4f3ea] via-[#f4f3ea]/20 to-transparent bottom-0 h-full" />
      </section>

      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 -mt-[80px] relative z-10 flex flex-col gap-10">
        
        {/* ─── Separated Title Component ────────────────────────── */}
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-[38px] sm:text-[46px] lg:text-[56px] font-bold text-[#001a40] leading-[1.05] tracking-tight max-w-[900px] mx-auto">
            {property.title}
          </h1>
          <div className="flex items-center gap-2 mt-5 text-[15px] font-medium text-[#4a5568]">
            <MapPin size={18} strokeWidth={2} className="text-[#001a40]" />
            <span className="underline underline-offset-4 decoration-current opacity-80">{property.location}</span>
          </div>
        </div>

        {/* ─── 9-Tile Spec Grid (White Container) ──────────────── */}
        <div className="bg-white rounded-[24px] px-8 py-10 shadow-[0px_10px_30px_rgba(0,26,64,0.03)] mx-auto w-full max-w-[1000px]">
          {/* Top row (5 items) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b-0 pb-2">
             <div className="flex flex-col items-center justify-center gap-1.5 focus:outline-none">
                <Tag size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Type</span>
                <span className="text-[14px] text-[#4a5568]">{property.type === 'sale' ? 'For Sale' : 'For Rent'}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <Wallet size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Price</span>
                <span className="text-[14px] text-[#4a5568]">{formattedPrice}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <Bed size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Beds</span>
                <span className="text-[14px] text-[#4a5568]">{property.bedrooms}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <Bath size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Baths</span>
                <span className="text-[14px] text-[#4a5568]">{property.bathrooms}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <Maximize2 size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Size</span>
                <span className="text-[14px] text-[#4a5568]">{property.size}</span>
             </div>
          </div>
          
          {/* Bottom row (4 items) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 md:px-12">
             <div className="flex flex-col items-center justify-center gap-1.5">
                <CalendarDays size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Built in</span>
                <span className="text-[14px] text-[#4a5568]">{property.builtYear || '2024'}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <Layers size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Floors</span>
                <span className="text-[14px] text-[#4a5568]">{property.floors || '2'}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <Car size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Parking</span>
                <span className="text-[13px] text-[#4a5568] leading-snug">{property.parking || 'Ample spaces'}</span>
             </div>
             <div className="flex flex-col items-center justify-center gap-1.5">
                <User size={28} strokeWidth={1.2} className="text-[#001a40] opacity-80" />
                <span className="text-[15px] font-bold text-[#001a40] mt-1">Property ID</span>
                <button 
                  onClick={handleCopyId}
                  className="flex items-center gap-1 text-[13px] text-[#4a5568] hover:text-[#006aff] transition-colors"
                >
                  {property.id} {copied ? <CheckCircle size={14} className="text-green-600"/> : <Copy size={14} />}
                </button>
             </div>
          </div>
        </div>

        {/* ─── Body Layout: Left Main Column & Right Sidebar ──── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 mt-6">
          
          {/* Main Left Column */}
          <div className="flex-1 w-full flex flex-col gap-12">
            
            {/* Masonry-Style Image Gallery */}
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 grid-rows-2 h-[420px] gap-3" data-cursor="view">
                {/* Image 1 - Large Left */}
                <div className="col-span-2 row-span-2 relative rounded-[16px] overflow-hidden cursor-pointer">
                  <Image src={property.images[0]} alt="Property feature" fill className="object-cover hover:scale-[1.03] transition-transform duration-700 ease-in-out" />
                </div>
                {/* Image 2 - Middle Large */}
                <div className="col-span-1 row-span-2 relative rounded-[16px] overflow-hidden cursor-pointer">
                  <Image src={property.images[1] || property.images[0]} alt="Property feature" fill className="object-cover hover:scale-[1.03] transition-transform duration-700 ease-in-out" />
                </div>
                {/* Image 3 - Top Right Small */}
                <div className="col-span-1 row-span-1 relative rounded-[16px] overflow-hidden cursor-pointer">
                  <Image src={property.images[2] || property.images[0]} alt="Property feature" fill className="object-cover hover:scale-[1.03] transition-transform duration-700 ease-in-out" />
                </div>
                {/* Image 4 - Bottom Right Small with 'View All' Overlay */}
                <div className="col-span-1 row-span-1 relative rounded-[16px] overflow-hidden cursor-pointer">
                  <Image src={property.images[3] || property.images[0]} alt="Property feature" fill className="object-cover hover:scale-[1.03] transition-transform duration-700 ease-in-out" />
                  <div className="absolute inset-0 bg-[#001a40]/30 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-[#001a40] text-white text-[12px] font-bold px-5 py-2.5 rounded-[8px] tracking-wider uppercase">
                      View All Images
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description Narrative */}
            {property.description && (
              <div>
                <p className="text-[18px] lg:text-[21px] text-[#001a40] leading-[1.65] font-medium tracking-tight whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities Grid */}
            <div>
              <h2 className="text-[28px] font-bold text-[#001a40] tracking-tight mb-6">Amenities</h2>
              <div className="flex flex-wrap gap-4">
                {property.amenities.map((amenity) => {
                  const IconComp = amenityIcons[amenity] || Info
                  return (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-[12px] bg-white text-[15px] text-[#001a40] font-medium shadow-[0px_4px_10px_rgba(0,0,0,0.02)] transition-transform duration-150 hover:-translate-y-0.5"
                    >
                      <IconComp size={18} strokeWidth={1.5} className="text-[#001a40]/70" />
                      {amenity}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Floor Breakdown Tables */}
            {property.floorPlan && (
              <div className="space-y-6">
                <p className="text-[16px] text-[#4a5568]">
                  {property.size} detached duplex across {property.floors || 2} floors. Full room-by-room breakdown to be confirmed at physical viewing.
                </p>

                {property.floorPlan.ground.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#001a40] uppercase tracking-wide mb-4">GROUND FLOOR (TYPICAL LAYOUT)</h3>
                    <div className="rounded-[16px] border border-dashed border-[#001a40]/20 overflow-hidden bg-white/50">
                      {property.floorPlan.ground.map((room, i) => (
                        <div key={room.room} className={`flex flex-col sm:flex-row sm:items-center px-6 py-4 border-b border-dashed border-[#001a40]/10 last:border-0`}>
                          <span className="text-[15px] font-bold text-[#001a40] w-[240px] flex-shrink-0">{room.room}</span>
                          <span className="text-[15px] text-[#4a5568]">{room.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {property.floorPlan.upper.length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#001a40] uppercase tracking-wide mb-4 mt-8">UPPER FLOOR (TYPICAL LAYOUT)</h3>
                    <div className="rounded-[16px] border border-dashed border-[#001a40]/20 overflow-hidden bg-white/50">
                      {property.floorPlan.upper.map((room, i) => (
                        <div key={room.room} className={`flex flex-col sm:flex-row sm:items-center px-6 py-4 border-b border-dashed border-[#001a40]/10 last:border-0`}>
                          <span className="text-[15px] font-bold text-[#001a40] w-[240px] flex-shrink-0">{room.room}</span>
                          <span className="text-[15px] text-[#4a5568]">{room.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Property Highlights */}
            {property.highlights && (
              <div>
                <h2 className="text-[28px] font-bold text-[#001a40] tracking-tight mb-6">Property Highlights</h2>
                <div className="space-y-4">
                  {property.highlights.map((highlight) => (
                    <p key={highlight} className="flex items-start gap-4 text-[16px] font-medium text-[#001a40]">
                      <span className="text-[#001a40] font-bold">✓</span>
                      {highlight}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Cinematic Video Placeholder */}
            <div className="relative w-full h-[400px] rounded-[24px] overflow-hidden mt-6" data-cursor="view">
              <Image src={property.images[0]} alt="Property video" fill className="object-cover" />
              <div className="absolute inset-0 bg-[#001a40]/40 flex items-center justify-center">
                <button className="w-[84px] h-[84px] rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 duration-200">
                  <Play size={36} fill="#001a40" className="text-[#001a40] ml-2" />
                </button>
              </div>
              <div className="absolute bottom-6 left-6">
                <span className="text-white text-[48px] font-serif leading-none tracking-tighter opacity-80 mix-blend-overlay">LH</span>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="relative w-full h-[360px] rounded-[24px] overflow-hidden border border-white bg-white/50 shadow-sm mt-4">
               <Image src="/images/property-jabi-1.jpg" alt="Map View Placeholder" fill className="object-cover opacity-30 grayscale blur-sm" />
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <MapPin size={42} strokeWidth={1}  className="text-[#001a40]" />
                  <span className="text-[15px] font-semibold text-[#001a40]">Map Location: {property.location}</span>
               </div>
            </div>

          </div>

          {/* Right Sidebar Form / Agent Box */}
          <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-8">
            
            {/* Agent Card */}
            <div className="bg-white rounded-[24px] p-8 shadow-[0px_8px_30px_rgba(0,26,64,0.03)] border border-transparent hover:border-[#001a40]/5 transition-colors sticky top-[90px]">
              
              <div className="flex items-center gap-5 mb-8">
                <div className="w-[60px] h-[60px] rounded-[16px] bg-[#f4f3ea] flex items-center justify-center border border-[#001a40]/5">
                  <span className="text-[22px] font-bold text-[#001a40]">MP</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#4a5568] uppercase tracking-[0.1em] font-semibold mb-1">Listed By</p>
                  <p className="text-[18px] font-bold text-[#001a40]">Propabridge Team</p>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-[#001a40]/10">
                  <div>
                    <p className="text-[14px] font-bold text-[#001a40] mb-0.5">Email</p>
                    <a href="mailto:hello@propabridge.com" className="text-[14px] text-[#4a5568] hover:text-[#006aff] underline underline-offset-4 decoration-current/30">
                      hello@propabridge.com
                    </a>
                  </div>
                  <Mail size={22} strokeWidth={1.5} className="text-[#001a40]" />
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-dashed border-[#001a40]/10">
                  <div>
                    <p className="text-[14px] font-bold text-[#001a40] mb-0.5">Phone</p>
                    <a href="tel:+2348090892219" className="text-[14px] text-[#4a5568] hover:text-[#006aff] underline underline-offset-4 decoration-current/30">
                      +234 809 089 2219
                    </a>
                  </div>
                  <Phone size={22} strokeWidth={1.5} className="text-[#001a40]" />
                </div>
              </div>

              <button className="w-full bg-[#006aff] hover:bg-[#0055cc] text-white px-6 py-4 rounded-[12px] text-[14px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-[0px_4px_16px_rgba(0,106,255,0.25)] hover:shadow-[0px_6px_20px_rgba(0,106,255,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
                AGENT DETAILS <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Inquiry Intake Form */}
            <div className="bg-white rounded-[24px] p-8 shadow-[0px_8px_30px_rgba(0,26,64,0.03)] border border-transparent">
               <h3 className="text-[24px] font-bold text-[#001a40] tracking-tight mb-2">Interested in this property?</h3>
               <p className="text-[15px] text-[#4a5568] mb-8 leading-snug">Fill in the form and we&apos;ll arrange a tour so you can explore this for yourself.</p>

               <form className="space-y-5">
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Name</label>
                    <input type="text" placeholder="Jane Smith" className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#001a40] text-[15px] placeholder-[#4a5568]/60 focus:outline-none focus:ring-2 focus:ring-[#006aff]/30 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Phone</label>
                    <input type="tel" placeholder="(123) 456-7890" className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#001a40] text-[15px] placeholder-[#4a5568]/60 focus:outline-none focus:ring-2 focus:ring-[#006aff]/30 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Email</label>
                    <input type="email" placeholder="jane@website.com" className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#001a40] text-[15px] placeholder-[#4a5568]/60 focus:outline-none focus:ring-2 focus:ring-[#006aff]/30 transition-all font-medium" />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Property ID</label>
                    <input type="text" defaultValue={property.id} disabled className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#4a5568] text-[15px] opacity-70 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Listing Title</label>
                    <input type="text" defaultValue={property.title} disabled className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#4a5568] text-[15px] max-w-full overflow-hidden text-ellipsis whitespace-nowrap opacity-70 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#001a40] mb-2">Message</label>
                    <textarea rows={4} placeholder="Write your message here" className="w-full px-5 py-3.5 rounded-[12px] bg-[#f4f3ea] border border-transparent text-[#001a40] text-[15px] placeholder-[#4a5568]/60 focus:outline-none focus:ring-2 focus:ring-[#006aff]/30 transition-all font-medium resize-none" />
                  </div>
                  
                  <button type="submit" className="w-full bg-[#001a40] hover:bg-[#002866] text-white px-6 py-4 rounded-[12px] text-[15px] font-bold tracking-widest mt-2 flex items-center justify-center gap-2 shadow-[0px_6px_24px_rgba(0,26,64,0.15)] hover:shadow-[0px_8px_30px_rgba(0,26,64,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                    SEND INQUIRY
                  </button>
               </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
