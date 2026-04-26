/**
 * PROPABRIDGE DESIGN SYSTEM
 * =========================
 * Single source of truth for all design tokens.
 * Import these into components for consistency.
 * Mirrors the Tailwind config — use CSS classes when possible,
 * use these JS tokens for dynamic/computed styles only.
 */

export const colors = {
  // ─── PRIMARY PALETTE ──────────────────────────────────────────
  navy: {
    DEFAULT: '#001a40',
    light: '#002a5e',
    50: '#f0f4ff',
  },
  action: {
    DEFAULT: '#006aff',
    hover: '#0052cc',
    light: 'rgba(0, 106, 255, 0.1)',
  },
  gold: {
    DEFAULT: '#ffc870',
    light: 'rgba(255, 200, 112, 0.15)',
  },
  beige: {
    DEFAULT: '#f4f3ea',
    dark: '#ebe9dc',
  },
  white: '#ffffff',

  // ─── STATUS COLORS ────────────────────────────────────────────
  verified: {
    DEFAULT: '#1a7a4a',
    light: 'rgba(26, 122, 74, 0.1)',
  },
  warning: {
    DEFAULT: '#d97706',
    light: 'rgba(217, 119, 6, 0.1)',
  },
  danger: {
    DEFAULT: '#c0392b',
    light: 'rgba(192, 57, 43, 0.1)',
  },

  // ─── NEUTRALS ─────────────────────────────────────────────────
  subtle: '#4a5568',
  divider: '#cbd5e0',
  placeholder: '#a0aec0',
} as const

export const typography = {
  family: "'Inter', system-ui, sans-serif",
  scale: {
    display: { size: '48px', weight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' },
    h1: { size: '36px', weight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' },
    h2: { size: '28px', weight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h3: { size: '22px', weight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h4: { size: '18px', weight: 600, lineHeight: 1.4 },
    body: { size: '15px', weight: 400, lineHeight: 1.6 },
    bodySmall: { size: '14px', weight: 400, lineHeight: 1.5 },
    caption: { size: '12px', weight: 400, lineHeight: 1.4 },
    badge: { size: '11px', weight: 600, lineHeight: 1.3, letterSpacing: '0.04em' },
    nav: { size: '13px', weight: 500, lineHeight: 1, letterSpacing: '0.02em' },
  },
} as const

export const spacing = {
  // 8pt system
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
} as const

export const radius = {
  card: '12px',
  button: '8px',
  badge: '20px',
  container: '8px',
  input: '8px',
  avatar: '50%',
} as const

export const shadows = {
  card: '0 4px 24px rgba(0, 26, 64, 0.08)',
  cardHover: '0 8px 32px rgba(0, 26, 64, 0.12)',
  badge: '0 2px 12px rgba(0, 26, 64, 0.14)',
  sidebar: '2px 0 16px rgba(0, 26, 64, 0.06)',
  topbar: '0 2px 8px rgba(0, 26, 64, 0.06)',
  modal: '0 20px 60px rgba(0, 26, 64, 0.18)',
} as const

export const layout = {
  sidebarWidth: '240px',
  sidebarCollapsed: '72px',
  topbarHeight: '72px',
  maxContentWidth: '1280px',
  authCardMaxWidth: '480px',
} as const

/**
 * VERIFIED BADGE GLASSMORPHISM STYLES
 * Apply these to the VerifiedBadge component
 */
export const verifiedBadgeStyles = {
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  borderRadius: '20px',
  padding: '6px 12px',
  boxShadow: shadows.badge,
} as const

/**
 * PROPERTY TYPE PILL STYLES
 */
export const propertyTypePill = {
  sale: {
    background: colors.navy.DEFAULT,
    color: colors.white,
  },
  rent: {
    background: colors.action.DEFAULT,
    color: colors.white,
  },
} as const

/**
 * NAVIGATION ITEM STATES
 */
export const navItemStyles = {
  active: {
    background: colors.beige.DEFAULT,
    borderLeft: `3px solid ${colors.action.DEFAULT}`,
    iconColor: colors.action.DEFAULT,
    textColor: colors.navy.DEFAULT,
  },
  hover: {
    background: colors.beige.DEFAULT,
    iconColor: colors.navy.DEFAULT,
    textColor: colors.navy.DEFAULT,
  },
  inactive: {
    background: 'transparent',
    iconColor: colors.subtle,
    textColor: colors.subtle,
  },
} as const

/**
 * BUTTON VARIANTS
 */
export const buttonVariants = {
  primary: {
    background: colors.action.DEFAULT,
    color: colors.white,
    border: 'none',
    hover: { background: colors.action.hover },
  },
  secondary: {
    background: 'transparent',
    color: colors.navy.DEFAULT,
    border: `1.5px solid ${colors.navy.DEFAULT}`,
    hover: { background: colors.beige.DEFAULT },
  },
  ghost: {
    background: colors.beige.DEFAULT,
    color: colors.navy.DEFAULT,
    border: 'none',
    hover: { background: colors.beige.dark },
  },
  danger: {
    background: 'transparent',
    color: colors.danger.DEFAULT,
    border: `1.5px solid ${colors.danger.DEFAULT}`,
    hover: { background: colors.danger.light },
  },
} as const
