import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AmenityChipProps {
  icon: LucideIcon
  label: string
  className?: string
}

/**
 * AmenityChip — Small pill-shaped tags for property features
 * EXACT spec from FOUNDATION.md Section 1.3 / ANTIGRAVITY_PROMPT
 */
export function AmenityChip({ icon: IconComponent, label, className }: AmenityChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-badge bg-beige border border-divider text-subtle text-caption',
        className
      )}
    >
      <IconComponent size={14} strokeWidth={1.5} />
      {label}
    </span>
  )
}
