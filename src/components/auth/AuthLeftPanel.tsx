'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'

interface AuthLeftPanelProps {
  variant: 'login' | 'signup'
}

/**
 * AuthLeftPanel — The left split-screen panel for auth pages
 * Deep Navy background with brand messaging over aerial estate photo
 * FOUNDATION.md Section 6.1 & 6.2
 */
export function AuthLeftPanel({ variant }: AuthLeftPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative min-h-screen">
      {/* Background image */}
      <Image
        src="/images/auth-left-panel-bg.jpg"
        alt="Aerial view of a modern Nigerian residential estate"
        fill
        className="object-cover"
        priority
      />
      {/* Navy overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 26, 64, 0.72)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        {/* Logo */}
        <div className="text-h4">
          <span className="font-bold text-white">MIDDLE</span>
          <span className="font-bold text-action">PARK</span>
        </div>

        {/* Main messaging */}
        <div className="max-w-[480px]">
          {variant === 'login' ? (
            <>
              <h1 className="text-[36px] font-bold text-white leading-tight tracking-tight">
                Find a verified home without the fear.
              </h1>
              <p className="mt-4 text-[16px] text-white leading-relaxed font-medium">
                Join thousands of Nigerians who found their homes on MiddlePark — zero fees, zero fake listings.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[36px] font-bold text-white leading-tight tracking-tight">
                Your verified home is one step away.
              </h1>
              <ul className="mt-6 space-y-4">
                {[
                  'Zero inspection fees',
                  'Every listing physically verified',
                  'AI-powered matching with agents',
                  'Instant WhatsApp notifications',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[16px] text-white font-medium"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-verified flex items-center justify-center">
                      <Check size={14} className="text-white" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Trust stats — login only */}
        {variant === 'login' && (
          <div className="flex gap-12">
            {[
              { value: '2,847+', label: 'Verified Listings' },
              { value: '0', label: 'Inspection Fees' },
              { value: '100%', label: 'Fraud-free Guarantee' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-h2 text-white font-bold">{stat.value}</p>
                <p className="text-[13px] text-white/90 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Signup — bottom tagline */}
        {variant === 'signup' && (
          <p className="text-[13px] font-medium text-white/90">
            ✓ Title Verified · ✓ Physically Inspected · ✓ Zero Inspection Fees
          </p>
        )}
      </div>
    </div>
  )
}
