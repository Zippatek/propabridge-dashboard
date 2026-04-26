'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'page'
  className?: string
}

/**
 * Loading — Super Creative Minimalist Brand align Loader
 * Features a perfectly smooth, pulsing glowing ring and an elegant inner
 * element or brand mark, representing building/bridges and real-estate luxury.
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const dimensions = {
    sm: { size: 24, stroke: 2 },
    md: { size: 40, stroke: 3 },
    lg: { size: 64, stroke: 3 },
    page: { size: 80, stroke: 4 },
  }

  const { size: dSize, stroke } = dimensions[size]

  return (
    <div className={cn('flex flex-col items-center justify-center gap-8 w-full h-full min-h-[50vh]', className)}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: dSize, height: dSize }}
      >
        {/* Outer glowing expanding ring */}
        <motion.div
           className="absolute inset-0 rounded-full border border-[#001a40]/10"
           animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
           transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Main rotating segmented ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="#001a40"
            strokeWidth={stroke * 2}
            strokeLinecap="round"
            strokeDasharray="90 190"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="#006aff" /* action color */
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="20 260"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* Minimalist Center Icon / Pulse */}
        <motion.div
           className="bg-[#001a40] rounded-sm flex items-center justify-center"
           style={{ width: dSize * 0.25, height: dSize * 0.25 }}
           animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 1, 1.15, 1], borderRadius: ["2px", "50%", "2px", "50%", "2px"] }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Brand text for full page loader */}
      {size === 'page' && (
        <motion.div 
          className="flex flex-col items-center gap-3 overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h2 className="text-[15px] font-semibold tracking-[0.25em] uppercase text-[#001a40]">
            Propa<span className="text-[#006aff]">bridge</span>
          </h2>
          {/* Scanning line under text */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#001a40]/30 to-transparent relative overflow-hidden">
            <motion.div
              className="absolute top-0 bottom-0 left-0 w-1/3 bg-[#001a40]"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
