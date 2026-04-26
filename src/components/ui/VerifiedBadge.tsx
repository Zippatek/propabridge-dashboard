import { Shield } from 'lucide-react'

/**
 * VerifiedBadge — Glassmorphism floating badge
 * Positioned absolutely within a relative parent (typically over property images)
 * EXACT spec from FOUNDATION.md Section 9.2
 */
export function VerifiedBadge() {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: '20px',
        padding: '6px 12px',
        boxShadow: '0 2px 12px rgba(0,26,64,0.14)',
      }}
      className="absolute bottom-3 left-3 flex items-center gap-1.5"
    >
      <Shield size={14} style={{ color: '#ffc870' }} strokeWidth={2} />
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#001a40' }}>
        Verified by Propabridge
      </span>
    </div>
  )
}
