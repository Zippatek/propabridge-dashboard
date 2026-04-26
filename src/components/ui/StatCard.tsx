'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  value: string
  label: string
  trend?: string
  className?: string
  delay?: number
}

/**
 * StatCard — Quick stats display card with hover animation
 */
export function StatCard({
  icon: IconComponent,
  iconColor,
  iconBgColor,
  value,
  label,
  trend,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#e2e8f0] rounded-card p-6 shadow-card card-lift animate-fade-up group relative overflow-hidden',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle gradient accent on hover */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
        style={{ backgroundColor: iconColor, opacity: 0 }}
      />
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-[0.06]"
        style={{ backgroundColor: iconColor }}
      />

      {/* Icon wrapper with subtle scale on hover */}
      <div
        className="w-12 h-12 rounded-card flex items-center justify-center transition-transform duration-300 group-hover:scale-110 relative z-10"
        style={{ backgroundColor: iconBgColor }}
      >
        <IconComponent size={24} style={{ color: iconColor }} strokeWidth={1.5} />
      </div>

      {/* Value with count-up animation */}
      <p className="text-h2 text-navy mt-4 animate-count-up relative z-10" style={{ animationDelay: `${delay + 200}ms` }}>
        {value}
      </p>

      {/* Label */}
      <p className="text-caption text-subtle mt-1 relative z-10">{label}</p>

      {/* Trend */}
      {trend && (
        <p className="text-caption text-verified mt-2 font-medium flex items-center gap-1 relative z-10">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-verified" />
          {trend}
        </p>
      )}
    </div>
  )
}
