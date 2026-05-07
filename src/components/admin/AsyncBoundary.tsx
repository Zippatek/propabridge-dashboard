'use client'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertTriangle } from 'lucide-react'

export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="py-20 text-center">
      <LoadingSpinner size="lg" />
      {label && <p className="text-body-sm text-subtle mt-3">{label}</p>}
    </div>
  )
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-danger-light border border-danger/20 text-danger rounded-card p-6 flex items-start gap-3">
      <AlertTriangle size={20} strokeWidth={1.8} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold">Failed to load</p>
        <p className="text-body-sm mt-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-caption font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}
