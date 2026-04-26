'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-smooth focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-action hover:bg-action-hover text-white',
      secondary: 'bg-transparent border-[1.5px] border-navy text-navy hover:bg-beige',
      ghost: 'bg-beige text-navy hover:bg-beige-dark',
      danger: 'bg-transparent border-[1.5px] border-danger text-danger hover:bg-danger-light',
    }

    const sizeStyles = {
      sm: 'px-4 py-2 text-body-sm rounded-button',
      md: 'px-8 py-3.5 rounded-button',
      lg: 'px-10 py-4 text-body-lg rounded-button',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
            <span className="opacity-80">Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
