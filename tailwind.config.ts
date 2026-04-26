import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── PROPABRIDGE COLOR SYSTEM ───────────────────────────────
      colors: {
        // Primary
        navy: {
          DEFAULT: '#001a40',
          light: '#002a5e',
          50: '#f0f4ff',
          100: '#d9e4f5',
        },
        // Action
        action: {
          DEFAULT: '#006aff',
          hover: '#0052cc',
          light: 'rgba(0, 106, 255, 0.1)',
        },
        // Accent
        gold: {
          DEFAULT: '#ffc870',
          light: 'rgba(255, 200, 112, 0.15)',
        },
        // Backgrounds
        beige: {
          DEFAULT: '#f4f3ea',
          dark: '#ebe9dc',
        },
        // Status
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
        // Neutrals
        subtle: '#4a5568',
        divider: '#cbd5e0',
        placeholder: '#a0aec0',
      },

      // ─── TYPOGRAPHY ──────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter-display)', 'Inter Display', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h1': ['36px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3': ['22px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'badge': ['11px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.04em' }],
        'nav': ['13px', { lineHeight: '1', fontWeight: '500', letterSpacing: '0.02em' }],
      },

      // ─── SPACING (8pt system) ─────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '18': '72px',
        '22': '88px',
        '30': '120px',
      },

      // ─── BORDER RADIUS ────────────────────────────────────────────
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'badge': '20px',
        'container': '8px',
        'input': '8px',
        'avatar': '50%',
      },

      // ─── BOX SHADOWS ─────────────────────────────────────────────
      boxShadow: {
        'card': '0 4px 24px rgba(0, 26, 64, 0.08)',
        'card-hover': '0 8px 32px rgba(0, 26, 64, 0.12)',
        'badge': '0 2px 12px rgba(0, 26, 64, 0.14)',
        'sidebar': '2px 0 16px rgba(0, 26, 64, 0.06)',
        'topbar': '0 2px 8px rgba(0, 26, 64, 0.06)',
        'modal': '0 20px 60px rgba(0, 26, 64, 0.18)',
        'none': 'none',
      },

      // ─── BACKGROUND GRADIENTS ────────────────────────────────────
      backgroundImage: {
        // Only navy-direction gradients permitted
        'navy-gradient': 'linear-gradient(135deg, #001a40 0%, #002a5e 100%)',
        'navy-bottom': 'linear-gradient(to bottom, transparent 0%, #001a40 100%)',
        // Subtle beige gradient for panels
        'beige-gradient': 'linear-gradient(180deg, #ffffff 0%, #f4f3ea 100%)',
      },

      // ─── TRANSITIONS ─────────────────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─── MAX WIDTHS ───────────────────────────────────────────────
      maxWidth: {
        'dashboard': '1280px',
        'auth-card': '480px',
        'property-card': '380px',
      },

      // ─── SIDEBAR WIDTH ────────────────────────────────────────────
      width: {
        'sidebar': '240px',
        'sidebar-collapsed': '72px',
      },

      // ─── HEIGHTS ─────────────────────────────────────────────────
      height: {
        'topbar': '72px',
        'property-image': '220px',
        'property-image-lg': '320px',
      },
    },
  },
  plugins: [],
}

export default config
