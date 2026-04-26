'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Maximize2, MapPin, ChevronRight } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Badge } from './Badge'
import { motion, useSpring } from 'framer-motion'

export interface PropertyCardProps {
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
  images: string[]
  verified: boolean
  isSaved?: boolean
  onSaveToggle?: (id: string) => void
  onViewDetails?: (id: string) => void
}

/**
 * PropertyCard — Ultra-premium Propabridge Card
 * Replicating exact Framer structures including the Cutout Tag Wrapper
 * and the floating "VIEW >" pointer on hover.
 */
export function PropertyCard({
  id,
  title,
  price,
  priceType,
  bedrooms,
  bathrooms,
  size,
  location,
  type,
  images,
}: PropertyCardProps) {
  // ─── Custom cursor state inside image container ──────────
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const mouseX = useSpring(0, { stiffness: 400, damping: 25 })
  const mouseY = useSpring(0, { stiffness: 400, damping: 25 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current) return
      const rect = imageRef.current.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [mouseX, mouseY]
  )

  return (
    <Link href={`/dashboard/property/${id}`} className="block">
      <div className="bg-[#f4f3ea] rounded-none overflow-visible group flex flex-col gap-[22px]">
        
        {/* ─── Image Container with Custom Cursor ────────── */}
        <div className="relative w-full rounded-[12px]">
          {/* Framer "Tag Wrapper" cutout effect */}
          <div
            className="absolute top-0 right-0"
            style={{
              boxSizing: 'border-box',
              width: 'min-content',
              height: 'min-content',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px 0px 10px 10px',
              backgroundColor: '#f4f3ea',
              overflow: 'visible',
              zIndex: 10,
              alignContent: 'center',
              flexWrap: 'nowrap',
              gap: '10px',
              borderRadius: '0px 0px 0px 17px',
            }}
          >
            <Badge variant={type === 'sale' ? 'sale' : 'rent'}>
              {type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
            </Badge>
          </div>

          <div
            className="relative h-[240px] md:h-[280px] w-full overflow-hidden rounded-[12px] cursor-none"
            data-cursor="view"
          >
            {images[0] ? (
              <Image
                src={images[0]}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-navy/5 flex items-center justify-center">
                <Maximize2 size={40} className="text-divider" />
              </div>
            )}
          </div>
        </div>

        {/* ─── Card Body ────────── */}
        <div className="flex flex-col gap-3 px-1 pt-1 pb-4">
          
          {/* Location row */}
          <p className="flex items-center gap-2 text-[13px] text-[#001a40] font-semibold uppercase tracking-wide">
            <span className="w-[18px] h-[18px] rounded-full border border-[#001a40] flex items-center justify-center flex-shrink-0">
              <MapPin size={10} strokeWidth={2} className="text-[#001a40]" />
            </span>
            <span className="truncate">{location}</span>
          </p>

          {/* Specs & Price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[14px] text-[#001a40] font-medium">
              <span className="flex items-center gap-1.5">
                <Bed size={16} strokeWidth={1.5} />
                {bedrooms} <span className="text-divider text-xs ml-1">•</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Bath size={16} strokeWidth={1.5} />
                {bathrooms} <span className="text-divider text-xs ml-1">•</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Maximize2 size={15} strokeWidth={1.5} />
                {size}
              </span>
            </div>
            <span className="text-[22px] font-bold text-[#001a40] whitespace-nowrap ml-4">
              {formatPrice(price, priceType)}
            </span>
          </div>

          {/* Horizontal Divider Line */}
          <div className="w-full h-[1px] bg-[#001a40]/15 my-1" />

          {/* Description Title */}
          <h4 className="text-[18px] font-medium text-[#001a40] leading-snug line-clamp-2 pr-4">
            {title}
          </h4>

        </div>
      </div>
    </Link>
  )
}
