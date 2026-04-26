import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 * Use this instead of raw className strings for conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format Nigerian Naira currency
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format price with appropriate suffix
 */
export function formatPrice(amount: number, priceType: 'yearly' | 'total'): string {
  const formatted = formatNaira(amount)
  return priceType === 'yearly' ? `${formatted}/yr` : formatted
}
