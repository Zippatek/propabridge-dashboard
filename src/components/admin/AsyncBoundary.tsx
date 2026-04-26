'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertTriangle } from 'lucide-react'

export function PageLoading() {
  return (
    <div className="py-20">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function PageError({ message }: { message: string }) {
  return (
    <div className="bg-danger-light border border-danger/20 text-danger rounded-card p-6 flex items-start gap-3">
      <AlertTriangle size={20} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Failed to load</p>
        <p className="text-body-sm mt-1">{message}</p>
      </div>
    </div>
  )
}
