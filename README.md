# Propabridge Dashboard
## Foundation Skeleton — Ready for Antigravity

Built by Zippatek Digital Ltd | CTO: Muhammad Muhammad Tukur

---

## What's in this skeleton

| File | Purpose |
|---|---|
| `ANTIGRAVITY_PROMPT.md` | **Start here** — Paste into Antigravity as system prompt |
| `FOUNDATION.md` | Complete screen-by-screen specification |
| `IMAGE_PROMPTS.md` | NanoBanana image generation prompts with filenames |
| `tailwind.config.ts` | Pre-configured design tokens |
| `src/lib/design-system.ts` | JS design token constants |
| `src/types/index.ts` | Full TypeScript type definitions |
| `package.json` | All required dependencies |

---

## How to use with Antigravity

### Step 1 — Create a new Antigravity project
Select: Next.js 14 + TypeScript + Tailwind CSS

### Step 2 — Drop in foundation files
Copy these files into your project root:
- `tailwind.config.ts` (replace the generated one)
- `package.json` (replace the generated one)
- `src/lib/design-system.ts`
- `src/types/index.ts`

### Step 3 — Feed the master prompt
Open Antigravity's system/context prompt input and paste the **entire contents** of `ANTIGRAVITY_PROMPT.md`.

### Step 4 — Feed the full spec
Then paste the entire `FOUNDATION.md` as additional context.

### Step 5 — Start Phase 1
Type: *"Begin Phase 1 — Foundation Setup. Start with package.json dependencies and then globals.css."*

### Step 6 — Generate images with NanoBanana
Open `IMAGE_PROMPTS.md` and run each prompt in NanoBanana. Save outputs to `/public/images/` with the filenames specified.

### Step 7 — Continue phase by phase
After each phase completes, type: *"Phase [N] complete. Begin Phase [N+1]."*

---

## Design Standard
The design must match **propabridge.com** exactly:
- Color-split logo: `PROPA` (Deep Navy) + `BRIDGE` (Electric Blue)
- Amenity chips: beige pill with stroke icon + grey label
- Verified badge: glassmorphism floating on property images
- Card radius: 12px | Button radius: 8px | Badge radius: 20px
- Typography: Inter only, left-aligned, no decorative fonts

---

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js v5
- Lucide React (icons)
- Framer Motion (subtle animations)
- Zustand (state)
- React Hook Form + Zod (forms)

---

*Propabridge Dashboard Foundation v1.0*
*April 2026 | Zippatek Digital Ltd*
