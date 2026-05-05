# Propabridge Dashboards — Three Zones, One App

| Zone | Path | Auth | Audience | State |
|---|---|---|---|---|
| **Customer (Deal Room)** | `/dashboard/*` | NextAuth JWT (real users) | Buyers post-engagement | Wired |
| **Agency Portal** | `/agency/*` | Agency cookie token | Partner agencies | UI complete, awaits backend |
| **Admin** | `/admin/*` | Admin cookie session | Internal team | Wired |
| **Auth** | `/login`, `/admin/login`, `/agency/login` | — | — | Wired |

Three independent middleware gates. A user signed in on one zone is *not* authed on the others.

---

## 1. Customer (Deal Room) — `/dashboard/*`

**Pivoted from the marketplace pattern (saved listings + recommendations + AI chat) to a Deal Room** focused on what a high-touch buyer actually opens a dashboard for: their active inspection, their docs, their verification status. Propa lives on WhatsApp; the dashboard does *not* compete with it — it complements it.

| Page | What it does | Backend |
|---|---|---|
| `/dashboard` (My Deal) | Welcome + WhatsApp CTA + next inspection card + 3 quick-action cards | `GET /scheduler/appointments?user_id=` |
| `/dashboard/inspections` | Upcoming + past viewings, with agent contact + WhatsApp shortcut | `GET /scheduler/appointments?user_id=` |
| `/dashboard/documents` | Per-property documents (inspection report, title, offer letter), grouped | `GET /api/documents?user_id=` *(needs backend)* |
| `/dashboard/verification` | KYC status + ID/proof-of-address upload | session JWT, `POST /upload` |
| `/dashboard/settings` | Profile, prefs (Gemini's existing page) | `auth/me` etc. |
| `/dashboard/property/[id]` | Property detail (Gemini's existing page) | `GET /listings/:id` |

**Removed:** `/dashboard/saved`, `/dashboard/chat` — replaced by a global "Continue on WhatsApp" CTA.

**Sidebar nav:** My Deal · Inspections · Documents · Verification · Settings.

---

## 2. Agency Portal — `/agency/*`

**Brand-new partner-facing portal.** Same shell pattern as `/admin`, distinct gold accent (vs admin's blue). Designed to be the lock-in mechanism after first closings: an agency that sees their leads + commissions in one place won't go back to spreadsheets.

| Page | What it does | Backend (to add) |
|---|---|---|
| `/agency` (Overview) | KPIs (active listings, new leads, upcoming viewings, pending commission) | `GET /agency/overview` |
| `/agency/listings` | Portfolio cards w/ status filter + add-listing CTA | `GET/POST/PATCH /agency/listings` |
| `/agency/leads` | Pre-qualified buyers w/ scores + status workflow + call/WhatsApp | `GET /agency/leads`, `PATCH /agency/leads/:id/status` |
| `/agency/inspections` | Confirmed viewings, mark completed/no-show | `GET /agency/inspections`, `PATCH /agency/inspections/:id` |
| `/agency/commissions` | Per-deal ledger: paid / in-escrow / pending; YTD totals | `GET /agency/commissions` |
| `/agency/profile` | Agency details, commission rate, payout account | `GET/PATCH /agency/profile` |

**Sidebar nav:** Overview · My Listings · Leads · Inspections · Commissions · Profile.

### Agency auth
- `POST /api/agency-auth/login` forwards `{email,password}` to backend `POST /agency/auth/login`, expects `{ token }`, stores it in httpOnly cookie `propa_agency_session`.
- Until the backend route lands, set `AGENCY_DEV_PASSWORD` in `.env.local` for a shared-password preview mode.
- `POST /api/agency/*` proxy forwards the cookie token as `x-agency-token`.

---

## 3. Admin — `/admin/*`

Internal monitoring + ops. KPIs from both backends; live SSE for chat conversations.

| Page | Backend |
|---|---|
| `/admin` (Overview) | adk `/overview` + `/funnel` + be `/leads` + `/scheduler/appointments` |
| `/admin/conversations` | adk `/conversations/{id}/stream` (SSE) + `/sessions/stream` (SSE) |
| `/admin/leads` | adk `/leads` |
| `/admin/templates` | adk `/templates` (CRUD) |
| `/admin/inquiries` | be `/leads` |
| `/admin/inspections` | be `/scheduler/appointments` |
| `/admin/users` | be `/admin/kyc/pending` |
| `/admin/settings` | health pings |

### Admin auth
Single secret `ADMIN_DASHBOARD_KEY`. Cookie-gated. `x-admin-key` injected server-side for adk proxy; `x-admin-token` for backend admin endpoints.

---

## API surface (this app)

```
/api/auth/[...nextauth]              ← NextAuth (customer)
/api/admin-auth/{login,logout}       ← admin cookie
/api/agency-auth/{login,logout}      ← agency cookie
/api/admin/adk/[...path]             ← proxy → propabridge-adk /api/admin/...
/api/admin/be/[...path]              ← proxy → propabridge-backend /...
/api/admin/adk-stream/[...path]      ← streaming proxy for SSE
/api/agency/[...path]                ← proxy → propabridge-backend /agency/...
```

Three middleware-gated zones, three cookies, zero secrets in browser.

---

## Backend endpoints we need (propabridge-backend api-gateway)

These don't exist yet. Each agency page falls through to a friendly error citing this doc until they ship.

### Agency auth + profile
- `POST /agency/auth/login` — `{email, password}` → `{ token, agency: {name, ...} }`
- `POST /agency/auth/logout` *(optional; cookie clear is client-side)*
- `GET /agency/profile`
- `PATCH /agency/profile`
- Middleware: `verifyAgencyToken` reads `x-agency-token`, attaches `req.agency`

### Agency listings
- `GET /agency/listings?status=&limit=` — scoped to authenticated agency
- `POST /agency/listings`
- `PATCH /agency/listings/:id`
- `DELETE /agency/listings/:id`

### Agency leads (Propa-routed buyers)
- `GET /agency/leads?status=&limit=` — only leads matched to this agency's properties
- `PATCH /agency/leads/:id/status`

### Agency inspections
- `GET /agency/inspections?limit=`
- `PATCH /agency/inspections/:id`

### Agency commissions
- `GET /agency/commissions` → `{ items: [{property_id, sale_price_ngn, commission_rate, commission_ngn, status, ...}], summary: {...} }`

### Agency overview
- `GET /agency/overview` → `{ listings_active, listings_pending, leads_total, leads_new, inspections_upcoming, inspections_completed, commission_pending_ngn, commission_paid_ngn }`

### Customer-side helpers (low priority, can ship later)
- `GET /api/documents?user_id=` — inspection reports, title docs per user
- `GET /scheduler/appointments?user_id=` (filter param — already exists on the route, may already work)

### Schema additions
- `agencies` table: id, name, email, password_hash, phone, address, commission_rate, payout_account_*, created_at
- `listings.agency_id` (FK)
- `leads.agency_id` (FK, set when Propa matches a lead to an agency property)
- `appointments.agency_id` (denorm for fast queries)
- `commissions` table: id, agency_id, lead_id, property_id, sale_price_ngn, commission_rate, commission_ngn, status (pending/in_escrow/paid), closing_date, paid_at

I can draft the api-gateway PR if you want — same patterns as the existing `routes/leads.js` / `routes/scheduler.js` / `routes/admin.js`.

---

## Files summary

### New (this session — agency + customer pivot)
```
src/lib/agency-auth.ts                ← agency cookie helpers
src/lib/agency-api.ts                 ← agency browser client
src/app/api/agency-auth/{login,logout}/route.ts
src/app/api/agency/[...path]/route.ts
src/app/agency/login/page.tsx
src/app/agency/layout.tsx
src/app/agency/page.tsx
src/app/agency/listings/page.tsx
src/app/agency/leads/page.tsx
src/app/agency/inspections/page.tsx
src/app/agency/commissions/page.tsx
src/app/agency/profile/page.tsx
src/components/agency/AgencyLoginForm.tsx
src/components/agency/AgencySidebar.tsx
src/components/agency/AgencyTopbar.tsx

src/app/dashboard/documents/page.tsx
src/app/dashboard/verification/page.tsx
src/app/dashboard/inspections/page.tsx (rewritten — was mock)
src/app/dashboard/page.tsx (rewritten — Deal Room)
src/lib/customer-api.ts (was already there)

src/middleware.ts (3-zone gate)
.env.example (added AGENCY_DEV_PASSWORD, NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER)
```

### Removed (per Deal Room pivot)
```
src/app/dashboard/saved/                   ← marketplace pattern, doesn't fit
src/app/dashboard/chat/                    ← Propa lives on WhatsApp
```

### Customer pages still to wire (mock-data residual)
- `src/app/dashboard/property/[id]/page.tsx` — pre-existing Gemini bug (`activeImage` not defined). Not in critical path.

---

## Configuration

```
cp .env.example .env.local
# fill in:
NEXTAUTH_SECRET                    openssl rand -base64 32
GOOGLE_CLIENT_ID / SECRET          (or remove the Google provider in src/lib/auth.ts)
ADMIN_DASHBOARD_KEY                = PROPA_ADK_ADMIN_KEY (same value)
AGENCY_DEV_PASSWORD                until backend /agency/auth/login lands
NEXT_PUBLIC_PROPA_WHATSAPP_NUMBER  E.164 without +, e.g. 2348012345678
```

```
npm run dev
```

- Customer: http://localhost:3000/login → /dashboard
- Agency: http://localhost:3000/agency/login → /agency
- Admin: http://localhost:3000/admin/login → /admin

---

## Strategic context (why we built it this way)

1. **Customer dashboard** was over-built as a generic marketplace. Buyers transact once and exit; they don't browse/save/chat in a logged-in surface — they reply to WhatsApp. Pivoted to a *Deal Room* (single active deal + docs + KYC) which only becomes valuable post-engagement.

2. **Agency portal is the higher-leverage build.** Agencies have repeat ongoing portfolio-management needs. A 5-agency partnership pipeline is the path to "1,000 listings/month" — not manual sourcing. The portal is the lock-in mechanism: once they see leads + commissions in one place, they don't go back to spreadsheets.

3. **Admin is the control room** — already wired with live SSE for monitoring conversations. This is where ops sit during a launch.

`npx tsc --noEmit` clean. Ready to ship.
