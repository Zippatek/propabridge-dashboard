'use client'

import Link from 'next/link'
import { Home, Calendar, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

type IllustrationType = 'house' | 'calendar' | 'chat'

export interface EmptyStateProps {
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  illustration?: IllustrationType
  className?: string
}

const illustrations: Record<IllustrationType, React.FC<{ className?: string }>> = {
  house: ({ className }) => (
    <div className={cn('relative', className)}>
      <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-beige to-white flex items-center justify-center shadow-sm animate-float">
        <Home size={48} strokeWidth={1.2} className="text-navy" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold/15 blur-lg" />
      <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-action/10 blur-md" />
    </div>
  ),
  calendar: ({ className }) => (
    <div className={cn('relative', className)}>
      <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-beige to-white flex items-center justify-center shadow-sm animate-float">
        <Calendar size={48} strokeWidth={1.2} className="text-navy" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-action/15 blur-lg" />
      <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-gold/10 blur-md" />
    </div>
  ),
  chat: ({ className }) => (
    <div className={cn('relative', className)}>
      <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-beige to-white flex items-center justify-center shadow-sm animate-float">
        <MessageCircle size={48} strokeWidth={1.2} className="text-navy" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold/15 blur-lg" />
      <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-action/10 blur-md" />
    </div>
  ),
}

/**
 * EmptyState — Centered placeholder for empty data views
 * FOUNDATION.md Section 9.5
 */
export function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
  illustration = 'house',
  className,
}: EmptyStateProps) {
  const Illustration = illustrations[illustration]

  return (
    <div className={cn('flex flex-col items-center text-center max-w-[360px] mx-auto py-16 animate-fade-up', className)}>
      <Illustration />
      <h3 className="text-h3 text-navy mt-6">{title}</h3>
      <p className="text-body text-subtle mt-2 leading-relaxed">{body}</p>
      <Link href={ctaHref} className="mt-6">
        <Button variant="primary" size="md" className="group">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  )
}
