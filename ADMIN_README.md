# Propabridge Dashboard — Architecture & Admin Section

## Two products, one Next.js app

```
/                      → marketing/foundation preview
/login, /signup        → customer NextAuth (real backend auth)
/dashboard/*           → CUSTOMER (gated by NextAuth JWT)
/admin/login           → admin key login
/admin/*               → ADMIN (gated by httpOnly cookie session)
```

Two **independent** auth systems so admins and end-users never collide.

## Backends wired

| Service | Base | Used by |
|---|---|---|
| `propabridge-backend` (api-gateway) | `PROPA_BACKEND_BASE` | customer auth, customer pages, admin Inquiries / Inspections / Users |
| `propabridge-adk` (FastAPI) | `PROPA_ADK_BASE` | admin Conversations (live SSE), Leads, Templates, Overview KPIs |

Secrets stay on the server. Browser only sees this app's own cookies. The
admin section calls upstream through proxy routes; SSE streams through a
streaming proxy so EventSource never sees the upstream key.

## Routes you can rely on now

### Customer
- `/login` — email + password (NextAuth credentials → `${PROPA_BACKEND_BASE}/auth/login`) or Google OAuth
- `/signup`, `/forgot-password` — Gemini's pages, untouched
- `/dashboard` — overview (greets the real signed-in user)
- `/dashboard/saved`, `/inspections`, `/chat`, `/settings`, `/property/[id]` — Gemini's pages on mock data; **next phase** wires them to the backend (saved listings, scheduler appointments, ai/chat endpoints already exist on api-gateway)

### Admin
- `/admin/login` — single secret = `ADMIN_DASHBOARD_KEY`
- `/admin` — KPIs from both backends + funnel + hot-leads escalation
- `/admin/conversations` — **live** session list (SSE) + live transcript (SSE) + manual WhatsApp takeover
- `/admin/leads` — ADK leads with intent + min-score filters
- `/admin/templates` — list / create / edit / delete WhatsApp templates
- `/admin/inquiries` — backend leads with status workflow + WhatsApp send
- `/admin/inspections` — backend appointments (upcoming/past/all) with status + reminder
- `/admin/users` — KYC review queue (backend `/admin/kyc/pending`)
- `/admin/settings` — backend connectivity ping + session info

## API surface (this app)

```
/api/auth/[...nextauth]      ← NextAuth (customer)
/api/admin-auth/login        ← admin cookie login
/api/admin-auth/logout
/api/admin/adk/[...path]     ← proxy → propabridge-adk /api/admin/...
/api/admin/be/[...path]      ← proxy → propabridge-backend /...
/api/admin/adk-stream/...    ← streaming proxy for SSE
```

All `/api/admin/*` and `/admin/*` are middleware-gated by the admin cookie.
All `/dashboard/*` is middleware-gated by the NextAuth JWT.

## Files added

```
src/middleware.ts                           ← two-zone gate
src/lib/api.ts                              ← server fetchers (adkFetch, beFetch)
src/lib/admin-auth.ts                       ← admin cookie helpers
src/lib/auth-helpers.ts                     ← server-side NextAuth helpers
src/lib/client-api.ts                       ← admin browser client (adk, be)
src/lib/customer-api.ts                     ← customer browser client
src/lib/types.ts                            ← API types for both backends
src/lib/format.ts                           ← formatRelativeTime, scoreClass, statusClass, formatNaira
src/app/providers.tsx                       ← <SessionProvider>
src/app/api/auth/[...nextauth]/route.ts
src/app/api/admin-auth/{login,logout}/route.ts
src/app/api/admin/adk/[...path]/route.ts
src/app/api/admin/be/[...path]/route.ts
src/app/api/admin/adk-stream/[...path]/route.ts
src/app/admin/layout.tsx
src/app/admin/login/page.tsx
src/app/admin/page.tsx
src/app/admin/conversations/page.tsx
src/app/admin/leads/page.tsx
src/app/admin/templates/page.tsx
src/app/admin/inquiries/page.tsx
src/app/admin/inspections/page.tsx
src/app/admin/users/page.tsx
src/app/admin/settings/page.tsx
src/components/admin/AdminSidebar.tsx
src/components/admin/AdminTopbar.tsx
src/components/admin/AdminLoginForm.tsx
src/components/admin/AsyncBoundary.tsx
```

## Files touched (kept Gemini's design system)

- `src/app/layout.tsx` — wrapped tree in `<Providers>`
- `src/components/layout/DashboardSidebar.tsx` — uses `useSession()` + real `signOut()` (was `mockUser`)
- `src/components/layout/DashboardTopbar.tsx` — uses `useSession()` (was `mockUser`)
- `src/app/dashboard/page.tsx` — greets real user via `useSession()`
- `.env.example` — refreshed for both backends + NextAuth
- `package.json` — no new dependencies (everything uses what was already installed)

## Configuring locally

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (or remove the Google provider)
   - `PROPA_ADK_ADMIN_KEY` — the value of `ADMIN_DASHBOARD_KEY` on the deployed propabridge-adk
   - `ADMIN_DASHBOARD_KEY` — should match the above (used by `/admin/login`)
   - `PROPA_BACKEND_ADMIN_TOKEN` if your backend's `verifyAdminRole` middleware checks `x-admin-token` (currently the inquiries / inspections / users pages will work without it for non-admin endpoints, but KYC/fraud need it)
3. `npm run dev`, visit:
   - `http://localhost:3000/login` → customer
   - `http://localhost:3000/admin/login` → admin

## Deployment

Same Cloud Run / Vercel deploy — single Next.js app. Env vars listed in
`.env.example`. No extra services to spin up.

## Next phase (customer-side data wiring)

These customer pages still render mock data; the API endpoints already
exist on the backend, so each page is a drop-in `customer.get(...)` call
from `src/lib/customer-api.ts`:

| Page | Backend endpoint |
|---|---|
| `/dashboard/saved` | needs `/users/me/saved` (not yet on api-gateway — add it, or store in `localStorage` for now) |
| `/dashboard/inspections` | `GET /scheduler/appointments?user_id=…` |
| `/dashboard/chat` | `POST /ai/chat`, `GET /ai/session/:id` |
| `/dashboard/property/[id]` | `GET /listings/:id` |
| `/dashboard` recommended | `GET /listings?limit=3` |

Same `customer-api.ts` pattern as the admin section — should take an hour
or two each.
