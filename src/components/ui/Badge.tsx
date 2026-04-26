import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'sale' | 'rent' | 'sold' | 'status' | 'count'
  children: React.ReactNode
  className?: string
}

/**
 * Badge — Property type pills matching the exact Framer site design
 * FOR SALE  → light green bg, dark green text
 * FOR RENT  → warm amber bg, dark text
 * SOLD      → coral/salmon bg, dark red text
 */
export function Badge({ variant = 'status', children, className }: BadgeProps) {
  const variantStyles = {
    sale: 'bg-[#e5f5cd] text-[#2c4712]',
    rent: 'bg-[#fec87c] text-[#5d3e02]',
    sold: 'bg-[#ff8989] text-[#750505]',
    status: 'bg-beige text-navy border border-divider',
    count: 'bg-beige text-subtle',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-4 py-1.5 rounded-[8px] text-[13px] font-bold uppercase tracking-wider',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
