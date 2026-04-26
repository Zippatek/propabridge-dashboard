# PROPABRIDGE DASHBOARD — ANTIGRAVITY FOUNDATION FILE
## Master Instructions for Full Application Generation
### Version 1.0 | Prepared by Zippatek Digital Ltd | April 2026

---

> **HOW TO USE THIS FILE**
> This is your single source of truth. Feed this entire file to Antigravity as the system foundation prompt before generating any code. Every screen, component, and interaction must conform to these specifications. Do not deviate. Do not invent new patterns. Build section by section, screen by screen, using the spec below.

---

## 0. STACK & TOOLING

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (custom config — see `design-system.ts`) |
| Auth | NextAuth.js v5 (credentials + Google provider) |
| Icons | Lucide React (stroke-only, never solid fill) |
| Fonts | Inter from Google Fonts (400, 500, 600, 700, 800) |
| State | Zustand |
| Forms | React Hook Form + Zod validation |
| Animations | Framer Motion (subtle only — trust-first, not entertainment) |
| Image placeholders | Use `/public/images/` with prompts defined in `IMAGE_PROMPTS.md` |
| Map | Mapbox GL JS (for property location maps) |

---

## 1. CRITICAL DESIGN DNA — READ THIS FIRST

The Propabridge website (propabridge.com) is the design standard. From the live site, these are the EXACT design patterns you must replicate in the dashboard:

### 1.1 Navigation Bar
- Pure white background (`#ffffff`), no shadow on load — only a `border-bottom: 1px solid #cbd5e0` appears on scroll
- Logo: `PROPA` in Deep Navy bold + `BRIDGE` in Electric Blue bold (color-split treatment, same font weight)
- Nav links: small letter-spacing, `font-size: 13px`, `font-weight: 500`, uppercase, color `#001a40`, spaced with `gap: 32px`
- Primary CTA button: `"CHAT WITH PROPA >"` — Deep Navy background (`#001a40`), white text, `border-radius: 8px`, includes a `>` arrow character inline, `padding: 10px 20px`
- Sticky on scroll

### 1.2 Property Cards (The Core UI Unit)
From the live site, property cards have this EXACT structure:
```
[Property Image — 12px radius top, no radius bottom]
  └── Floating pill badge: "FOR SALE" or "FOR RENT" — top-left of image
  └── Verified Badge (glassmorphism) — bottom-left of image
[White card body]
  ├── Price: Bold, Deep Navy, large
  ├── Size: e.g. "400 SQM" — grey caption
  ├── Beds / Baths / Parking row with stroke icons
  ├── Property title: Semi-bold
  ├── Location: Caption grey with pin icon
  └── Property ID: bottom-right caption, e.g. "PB-ABJ-0095"
```
Card shadow: `box-shadow: 0 4px 24px rgba(0, 26, 64, 0.08)`
Card radius: `12px`
Hover: subtle lift — `translateY(-2px)` + shadow deepens slightly

### 1.3 Amenity Chips/Tags
From the listings page — small pill-shaped tags for property features:
- Background: `#f4f3ea` (Light Beige)
- Border: `1px solid #cbd5e0`
- Text: `#4a5568` (Cool Grey), `font-size: 12px`, `font-weight: 500`
- Icon: stroke Lucide icon at `16px`, `#4a5568`
- Radius: `20px` (full pill)
- Padding: `6px 12px`
- Examples: "Balcony", "Garden", "BQ", "Generator", "Borehole", "Swimming Pool"

### 1.4 Agent/Contact Sidebar Card
From property detail page:
- White card, `border: 1px solid #cbd5e0`, `border-radius: 8px`
- House icon (stroke, `#ffc870` gold) at top
- "LISTED BY" caption in grey, `font-size: 11px`, uppercase
- "Propabridge Team" in Deep Navy, semi-bold
- Email row with envelope stroke icon
- Phone row with phone stroke icon
- Primary CTA: Electric Blue "AGENT DETAILS >" button

### 1.5 Forms & Inputs
- Input border: `1px solid #cbd5e0`
- Input radius: `8px`
- Input padding: `12px 16px`
- Placeholder color: `#a0aec0`
- Focus ring: `2px solid #006aff`
- Label: `font-size: 13px`, `font-weight: 500`, Deep Navy
- Error state: `border-color: #c0392b`

### 1.6 Floor Plan / Specs Table
Two-column table, no border-collapse visible, row-level separation:
- Left col: Bold, Deep Navy, `font-weight: 600`
- Right col: Regular, Cool Grey
- Row divider: `border-bottom: 1px solid #f4f3ea`
- Section headers: uppercase, `font-size: 11px`, `letter-spacing: 0.08em`, Deep Navy

### 1.7 City/Location Cards (3-column grid)
Used on contact page and can be adapted for area selection:
- White background, `border: 1px solid #e2e8f0`
- Pin icon in Electric Blue at top
- City name in Deep Navy, H3 weight
- Details in Cool Grey body text

### 1.8 Social/Icon Row
Used for social links — full-width row, equal columns, `background: #001a40`, white icons centered, `border-radius: 0`, `padding: 16px`

---

## 2. COLOR SYSTEM — TAILWIND CUSTOM CONFIG

```typescript
// tailwind.config.ts — extend.colors
colors: {
  navy: {
    DEFAULT: '#001a40',
    light: '#002a5e',
    50: '#f0f4ff',
  },
  blue: {
    action: '#006aff',
    hover: '#0052cc',
  },
  gold: {
    DEFAULT: '#ffc870',
  },
  beige: {
    DEFAULT: '#f4f3ea',
  },
  green: {
    verified: '#1a7a4a',
  },
  amber: {
    warn: '#d97706',
  },
  red: {
    alert: '#c0392b',
  },
  grey: {
    subtle: '#4a5568',
    divider: '#cbd5e0',
    placeholder: '#a0aec0',
  }
}
```

---

## 3. TYPOGRAPHY RULES

```css
/* Global base — add to globals.css */
body {
  font-family: 'Inter', sans-serif;
  color: #001a40;
  background: #f4f3ea;
  line-height: 1.5;
}

h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
h3 { font-size: 20px; font-weight: 600; }
p  { font-size: 15px; font-weight: 400; color: #4a5568; line-height: 1.6; }
.caption { font-size: 12px; font-weight: 400; color: #4a5568; }
.badge-text { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
```

**NEVER**: All-caps body text. Serif fonts. Text shadows. Decorative fonts.
**ALWAYS**: Left-aligned body text. Center only for standalone badges and page-level CTAs.

---

## 4. SPACING SYSTEM

Use 8pt scale exclusively: `4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 | 96`px

In Tailwind terms: `p-1 | p-2 | p-3 | p-4 | p-6 | p-8 | p-12 | p-16 | p-24`

Section vertical padding minimum: `py-12` (48px)
Card internal padding: `p-6` (24px)
No element should have less than `p-4` (16px) breathing room from edges.

---

## 5. APPLICATION ARCHITECTURE

### 5.1 Route Structure (App Router)
```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── forgot-password/page.tsx
├── dashboard/
│   ├── layout.tsx              ← Dashboard shell (sidebar + topbar)
│   ├── page.tsx                ← Overview / Home
│   ├── saved/page.tsx          ← Saved Properties
│   ├── inspections/page.tsx    ← Booked Inspections
│   ├── chat/page.tsx           ← Chat with Propa AI
│   └── settings/page.tsx       ← Profile & Settings
└── layout.tsx                  ← Root layout (fonts, providers)
```

### 5.2 Component Structure
```
components/
├── layout/
│   ├── DashboardSidebar.tsx
│   ├── DashboardTopbar.tsx
│   └── DashboardShell.tsx
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── VerifiedBadge.tsx       ← Glassmorphism verified badge
│   ├── AmenityChip.tsx
│   ├── PropertyCard.tsx
│   ├── StatCard.tsx
│   ├── EmptyState.tsx
│   └── LoadingSpinner.tsx
├── property/
│   ├── PropertyGrid.tsx
│   ├── PropertyDetail.tsx
│   └── PropertySearchBar.tsx
└── auth/
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    └── ForgotPasswordForm.tsx
```

---

## 6. AUTHENTICATION SCREENS

### 6.1 Login Page (`/login`)

**Layout**: Split-screen — Left half: Deep Navy background with brand messaging. Right half: White card with form.

**Left panel (Deep Navy `#001a40`)**:
- Propabridge logo (white version) top-left
- Large quote in white: *"Find a verified home without the fear."*
- Sub-copy in light grey: *"Join thousands of Nigerians who found their homes on Propabridge — zero fees, zero fake listings."*
- Bottom: Three trust stats in a row:
  - `2,847+` Verified Listings
  - `0` Inspection Fees
  - `100%` Fraud-free Guarantee
- Background image: Nigerian residential estate aerial photo with `rgba(0,26,64,0.7)` overlay

**Right panel (White)**:
- "Welcome back" — H2, Deep Navy
- Sub-copy: "Sign in to your Propabridge account" — Body, grey
- Google OAuth button (outlined, with Google icon)
- Divider: `— or continue with email —`
- Email input + Password input
- "Forgot password?" link — Electric Blue, right-aligned
- Primary CTA: `"SIGN IN >"` — Electric Blue button, full width
- Bottom: "Don't have an account? **Create one →**"

**Validation**:
- Zod schema: email format, password min 8 chars
- Inline error messages below inputs
- Loading state on submit button

### 6.2 Sign Up Page (`/signup`)

**Layout**: Same split-screen. Left panel content changes:
- Headline: *"Your verified home is one step away."*
- A checklist (with green checkmarks):
  - ✓ Zero inspection fees
  - ✓ Every listing physically verified
  - ✓ AI-powered matching with Propa
  - ✓ Instant WhatsApp notifications

**Right panel**:
- "Create your account" — H2
- First Name + Last Name (side by side)
- Email input
- Phone (WhatsApp number — important for Propa notifications)
- Password + Confirm Password
- Checkbox: "I agree to Propabridge's Terms & Privacy Policy"
- Primary CTA: `"CREATE ACCOUNT >"` — Electric Blue, full width
- Below: "Already have an account? **Sign in →**"

### 6.3 Forgot Password (`/forgot-password`)

**Layout**: Centered card on Light Beige background.
- Card: White, `border-radius: 12px`, `padding: 48px`, max-width `480px`
- Lock icon (stroke, gold) centered at top
- H2: "Reset your password"
- Body: "Enter the email on your account. We'll send a reset link."
- Email input
- CTA: `"SEND RESET LINK >"` — Electric Blue
- Back link: `← Back to sign in`

---

## 7. DASHBOARD SHELL (layout.tsx)

### 7.1 Sidebar
**Width**: `240px` fixed on desktop, collapses to icon-only `72px` on tablet, drawer on mobile.
**Background**: White (`#ffffff`)
**Border**: `border-right: 1px solid #cbd5e0`

**Structure**:
```
[Logo — top, 32px padding]
[Navigation Links — middle]
[User profile card — bottom]
```

**Logo**: Same color-split treatment — `PROPA` Deep Navy + `BRIDGE` Electric Blue

**Navigation Items** (with Lucide stroke icons at `20px`):
| Icon | Label | Route |
|---|---|---|
| LayoutDashboard | Overview | /dashboard |
| Heart | Saved Properties | /dashboard/saved |
| Calendar | Inspections | /dashboard/inspections |
| MessageCircle | Chat with Propa | /dashboard/chat |
| Settings | Settings | /dashboard/settings |

**Active state**: Electric Blue left border `(border-left: 3px solid #006aff)` + Light Beige background `#f4f3ea` + Electric Blue icon color
**Hover state**: Light Beige background, no border
**Inactive**: Cool Grey icon and text

**User card at bottom**:
- Circle avatar (50% radius), 40px
- Name in Deep Navy, `font-size: 14px`, `font-weight: 600`
- Email in Cool Grey, `font-size: 12px`
- Logout icon (LogOut from Lucide)

### 7.2 Topbar
**Height**: `72px`
**Background**: White
**Border**: `border-bottom: 1px solid #cbd5e0`

**Left**: Page title (dynamic — matches current route)
**Center**: Search bar — `"Search verified properties..."` placeholder, `border-radius: 20px`, `background: #f4f3ea`, `border: none`, Lucide `Search` icon inside
**Right**:
- Bell icon (Lucide, `20px`) with notification dot (Electric Blue)
- Avatar (circle, 36px) → opens profile dropdown

---

## 8. DASHBOARD SCREENS

### 8.1 Overview Page (`/dashboard`)

**Section 1 — Welcome Banner**
Full-width banner, Deep Navy background (`#001a40`), `border-radius: 12px`, `padding: 32px 40px`
- Left: "Good morning, [Name] 👋" — H2, white
- Sub-copy: "You have 3 properties saved and 1 inspection booked." — white, 80% opacity
- Right: Illustration or property image with `rgba(0,26,64,0.4)` overlay
- CTA button: "Browse Verified Listings →" — Electric Blue background (on dark panel, blue is appropriate here as action)

**Section 2 — Quick Stats (4-card grid)**
Cards: White, `border: 1px solid #e2e8f0`, `border-radius: 12px`, `padding: 24px`, soft shadow

| Stat | Icon | Value | Label |
|---|---|---|---|
| Saved Properties | Heart (stroke, gold) | `{count}` | Properties saved |
| Inspections Booked | Calendar (stroke, blue) | `{count}` | Upcoming visits |
| Properties Viewed | Eye (stroke, navy) | `{count}` | This month |
| Propa Conversations | MessageCircle (stroke, green) | `{count}` | Total chats |

**Section 3 — Recently Viewed / Recommended**
H2: "Recommended for you"
Sub: "Based on your search history and saved preferences"
3-column property card grid. See Property Card spec in Section 6.2.

**Section 4 — Upcoming Inspection (if booked)**
Single card with:
- Calendar icon (gold) + "Upcoming Inspection" label
- Property name, address, date/time
- Two buttons: "View on Map" (outlined) | "Reschedule" (ghost)

### 8.2 Saved Properties (`/dashboard/saved`)

**Header row**:
- H1: "Saved Properties"
- Count badge: e.g. "12 properties" in pill (beige background)
- Sort dropdown: "Sort by: Date saved" (outlined select)

**Filter chips row** (horizontally scrollable):
Ghost chips: All | For Rent | For Sale | Abuja | Kaduna | Minna | Under ₦3M | 3+ Bedrooms

**Property Grid**: 3-column responsive → 2-col tablet → 1-col mobile
Each card has a Heart icon (filled red) to unsave, plus the full card spec.

**Empty State** (when no saved properties):
- Centered in page
- Illustration: minimalist stroke house + magnifying glass (Deep Navy on beige bg)
- H3: "No saved properties yet"
- Body: "Browse verified listings and tap the heart to save properties you like."
- CTA: "Browse Listings →" (Electric Blue button)

### 8.3 Inspections (`/dashboard/inspections`)

**Two tabs**: "Upcoming" | "Past"

**Upcoming Inspection Card** (list layout, not grid):
White card, `border-left: 4px solid #006aff` (Electric Blue accent)
- Left: Property thumbnail (80px × 80px, `border-radius: 8px`)
- Middle:
  - Property name (bold, navy)
  - Address (caption, grey, with MapPin icon)
  - Date & Time (with Calendar icon, Electric Blue)
  - Confirmation number: `#CONF-20260411` (caption)
- Right actions:
  - "View Property" (outlined button)
  - "Cancel" (ghost button, red text)

**Past Inspection Card**: Same layout but `border-left: 4px solid #cbd5e0` (grey)
- Add "Rate this property" — 5 stars (gold, stroke → filled on hover)

**Empty State**: Calendar icon + "No inspections booked yet" + "Find a property →" CTA

### 8.4 Chat with Propa (`/dashboard/chat`)

**Layout**: Full-height split — Left: conversation, Right: property cards panel

**Chat Area**:
- Messages in bubbles
- User messages: Right-aligned, Electric Blue background, white text, `border-radius: 16px 16px 4px 16px`
- Propa messages: Left-aligned, White background, Deep Navy text, `border: 1px solid #e2e8f0`, `border-radius: 16px 16px 16px 4px`
- Propa avatar: Small circle with Propabridge P logo, `background: #001a40`
- Timestamps in caption grey below each bubble group

**Input area** (bottom):
- Text input: rounded full, `background: #f4f3ea`, no border, `padding: 14px 20px`
- Send button: Electric Blue circle button with ArrowRight icon (Lucide)
- Attachment chip (optional): paperclip icon

**Right panel — Property Cards**:
- Only visible on desktop and when Propa returns property results
- Compact card version: image top, price, title, "View Details" link
- Header: "Properties Propa found for you"

**Suggested quick replies** (above input when conversation starts):
Pill buttons in beige: "Find a 3-bed in Gwarinpa", "Properties under ₦2M", "Show me verified estates"

### 8.5 Settings (`/dashboard/settings`)

**Tab navigation**: Profile | Notifications | Preferences | Account

**Profile tab**:
- Avatar upload circle (with camera icon overlay on hover)
- Form: First Name, Last Name, Email (readonly + "Change" link), WhatsApp Number, State, City
- Save button (Electric Blue)

**Notifications tab**:
Toggle switches (Propabridge-styled: navy track when on, grey when off) for:
- New listing matches
- Inspection reminders (24h and 1h)
- Propa AI responses via WhatsApp
- Weekly neighborhood guides
- New verified listings in saved areas

**Preferences tab**:
- Property intent: Rent / Buy / Invest (pill toggle)
- Budget range: dual-handle slider
- Preferred areas: multi-select chips (Abuja, Kaduna, Minna areas)
- Bedrooms: number stepper

**Account tab**:
- Change password form
- Delete account (danger zone — red outlined button, confirmation modal)
- Sign out all devices

---

## 9. COMPONENT SPECIFICATIONS

### 9.1 Button Component
```tsx
// variants: 'primary' | 'secondary' | 'ghost' | 'danger'
// sizes: 'sm' | 'md' | 'lg'

Primary:
  bg: #006aff | text: white | radius: 8px | px: 32px | py: 14px
  hover: bg #0052cc | transition: all 150ms ease
  loading: spinner replaces text, opacity 0.8
  
Secondary:
  bg: transparent | border: 1.5px solid #001a40 | text: #001a40
  Same padding and radius as primary
  
Ghost:
  bg: #f4f3ea | text: #001a40 | no border
  
Danger:
  bg: transparent | border: 1.5px solid #c0392b | text: #c0392b
```

### 9.2 VerifiedBadge Component
```tsx
// Glassmorphism floating badge — appears on property images
Position: absolute, bottom: 12px, left: 12px
Background: rgba(255,255,255,0.85)
Backdrop-filter: blur(8px)
Border: 1px solid rgba(255,255,255,0.6)
Border-radius: 20px
Padding: 6px 12px
Shadow: 0 2px 12px rgba(0,26,64,0.14)

Content:
  Shield icon (Lucide Shield, 14px, color: #ffc870)
  Text: "Verified by Propabridge" (font-size: 11px, font-weight: 600, color: #001a40)
```

### 9.3 PropertyCard Component
```tsx
Props: {
  id: string           // e.g. "PB-ABJ-0095"
  title: string
  price: number
  priceType: 'yearly' | 'total'
  bedrooms: number
  bathrooms: number
  size: string         // e.g. "400 SQM"
  location: string
  neighborhood: string
  type: 'rent' | 'sale'
  images: string[]
  verified: boolean
  isSaved?: boolean
}

Card structure:
  [image wrapper — h: 220px, radius top: 12px]
    [type pill — absolute top-left: 12px]
      "FOR RENT" or "FOR SALE" 
      bg: #001a40, text: white, font-size: 11px, bold
    [VerifiedBadge — absolute bottom-left]
    [Heart button — absolute top-right: 12px]
      stroke when unsaved, filled red when saved
  [card body — padding: 20px]
    [price row]
      price in H3 Deep Navy
      size in caption grey
    [specs row — gap: 16px]
      Bed icon + count | Bath icon + count | Maximize icon + sqm
    [title — font-weight: 600, margin-top: 8px]
    [location — MapPin icon 14px + address, caption grey]
    [footer — border-top: 1px solid #f4f3ea, margin-top: 12px, padding-top: 12px]
      Property ID left: caption grey
      "View Details →" right: Electric Blue, semi-bold, 13px
```

### 9.4 StatCard Component
```tsx
Props: { icon: LucideIcon; iconColor: string; value: string; label: string; trend?: string }

Structure:
  bg: white | border: 1px solid #e2e8f0 | radius: 12px | padding: 24px
  [icon wrapper — bg: tinted (10% opacity of iconColor), 48x48, radius: 12px]
    [icon centered at 24px]
  [value — H2 Deep Navy, margin-top: 16px]
  [label — caption grey, margin-top: 4px]
  [trend chip if present — green text "+2 this week"]
```

### 9.5 EmptyState Component
```tsx
Props: { title: string; body: string; ctaLabel: string; ctaHref: string; illustration: 'house' | 'calendar' | 'chat' }

Structure: centered, max-width 360px, margin: auto
  [illustration — 120px, svg stroke illustration in navy on beige bg circle]
  [title — H3 Deep Navy, text-center, margin-top: 24px]
  [body — body grey, text-center, margin-top: 8px]
  [CTA button — Electric Blue, margin-top: 24px]
```

---

## 10. AUTH CONFIGURATION (NextAuth.js)

```typescript
// lib/auth.ts
providers: [
  GoogleProvider({ clientId, clientSecret }),
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    authorize: async (credentials) => {
      // Validate against your user store / API
      // Return user object or null
    }
  })
]
session: { strategy: 'jwt' }
pages: {
  signIn: '/login',
  error: '/login',
}
callbacks: {
  jwt: ({ token, user }) => { if (user) token.id = user.id; return token; },
  session: ({ session, token }) => { session.user.id = token.id; return session; }
}
```

---

## 11. FORM VALIDATION SCHEMAS (Zod)

```typescript
// lib/validations.ts

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^(\+234|0)[0-9]{10}$/, 'Enter a valid Nigerian number'),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
```

---

## 12. MOCK DATA (for development)

```typescript
// lib/mock-data.ts

export const mockProperties = [
  {
    id: 'PB-ABJ-0095',
    title: '4-Bedroom Detached Duplex — Promenade Estate Cluster 7',
    price: 95000000,
    priceType: 'total',
    bedrooms: 4,
    bathrooms: 4,
    size: '400 SQM',
    location: 'Lokogoma, Abuja',
    neighborhood: 'Lokogoma',
    type: 'sale',
    verified: true,
    images: ['/images/property-lokogoma-1.jpg'],
    amenities: ['BQ', 'Generator', 'Borehole', 'Ample Parking', 'Private Garden'],
  },
  {
    id: 'PB-ABJ-0096',
    title: '3-Bedroom Flat — Gwarinpa Estate Phase 2',
    price: 2500000,
    priceType: 'yearly',
    bedrooms: 3,
    bathrooms: 3,
    size: '180 SQM',
    location: 'Gwarinpa, Abuja',
    neighborhood: 'Gwarinpa',
    type: 'rent',
    verified: true,
    images: ['/images/property-gwarinpa-1.jpg'],
    amenities: ['Generator', 'Borehole', 'Security', 'Parking'],
  },
  {
    id: 'PB-KD-0012',
    title: '5-Bedroom Duplex — Millennium City Estate',
    price: 180000000,
    priceType: 'total',
    bedrooms: 5,
    bathrooms: 5,
    size: '650 SQM',
    location: 'Babban Saura, Kaduna',
    neighborhood: 'Babban Saura',
    type: 'sale',
    verified: true,
    images: ['/images/property-kaduna-1.jpg'],
    amenities: ['BQ', 'Swimming Pool', 'Generator', 'Borehole', 'Smart Gate'],
  },
]

export const mockUser = {
  name: 'Aminu Ibrahim',
  email: 'aminu@example.com',
  phone: '08012345678',
  savedProperties: ['PB-ABJ-0095', 'PB-ABJ-0096'],
  inspections: [
    {
      id: 'INS-001',
      propertyId: 'PB-ABJ-0095',
      date: '2026-04-15',
      time: '10:00 AM',
      confirmationNumber: 'CONF-20260415',
      status: 'upcoming',
    }
  ]
}
```

---

## 13. RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Change |
|---|---|---|
| Mobile | < 768px | Single column, sidebar becomes bottom drawer |
| Tablet | 768–1024px | Sidebar collapses to icon-only (72px) |
| Desktop | > 1024px | Full sidebar (240px) + content area |
| Wide | > 1440px | Max content width 1280px, centered |

Property grid: 3-col → 2-col → 1-col

---

## 14. ANIMATION PRINCIPLES

Use Framer Motion only for:
- Page transitions: subtle `opacity: 0→1` + `y: 8→0`, duration `200ms`
- Card hover: `y: 0→-2px`, shadow deepens
- Sidebar active item: smooth left border transition
- Notification dot: pulse animation
- Empty state illustration: single fade-in on mount

**NEVER**: Spinning loaders that feel playful. Bounce effects. Dramatic page transitions. Trust-first means calm, not flashy.

---

## 15. BANNED PATTERNS — ABSOLUTE RULES

1. ❌ No gradient backgrounds except Deep Navy → `#002a5e` (dark direction only)
2. ❌ Never use Electric Blue `#006aff` as a large background area
3. ❌ Never use the words: "premium", "seamless", "state-of-the-art", "trusted", "revolutionary", "game-changer", "innovative" in UI copy
4. ❌ No solid/filled icons anywhere — stroke only (Lucide React)
5. ❌ Never attribute listings to a developer company name — always "Propabridge Team"
6. ❌ No emojis in formal UI components (only in chat bubbles and Propa messages)
7. ❌ No harsh box shadows — use only the specified soft shadow values
8. ❌ Never place text directly on a property photo without a dark overlay
9. ❌ No border-radius > 20px on large containers. Cards: 12px. Buttons: 8px. Badges: 20px pill.
10. ❌ Every property card MUST show a Property ID (PB-XXXX) in caption bottom-right

---

## 16. PROPABRIDGE SIGNATURE COPY RULES

**Use ONLY these phrases for trust/verification messaging:**
- "Verified by Propabridge" (not "trusted" or "certified")
- "Zero Fees. Zero Fears." (exact — never paraphrase)
- "Physically inspected and title-verified"
- "✓ Title Verified · ✓ Physically Inspected · ✓ Zero Inspection Fees"

**Dashboard copy tone:**
- Warm and direct, like a knowledgeable friend
- No corporate jargon
- Occasional natural Nigerian warmth in Propa chat responses ("no wahala", "oya")
- Never pushy or sales-bro in notifications

---

*Foundation File v1.0 | Propabridge Dashboard | Zippatek Digital Ltd*
*CTO: Muhammad Muhammad Tukur | April 2026*
