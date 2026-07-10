# Sotorko (সতর্ক)

> Know Before You Go.

Sotorko is a privacy-first, community-powered safety intelligence platform helping women in Dhaka make informed travel decisions through anonymous, crowdsourced safety reports — presented on a calm, trustworthy map rather than fear-driven content.

This repository is a working MVP scaffold covering Phases 1–6 of the build roadmap (UI shell, interactive map, anonymous reporting, community confirmations, moderation, and performance/accessibility hardening). **It is not production-ready as-is** — see [Current Status](#current-status) and `PROJECT_CONTEXT.md` before treating this as launch-ready.

---

## Current Status

| Phase | Area | Status |
|---|---|---|
| 1 | UI shell, design system | ✅ Done |
| 2 | Interactive map, search, safety score, filters | ✅ Done |
| 3 | Anonymous reporting (form, privacy offset, edit codes) | ✅ Done |
| 4 | Community confirmations | ✅ Done |
| 5 | Trust scoring, moderation queue, admin dashboard | ✅ Done (interim auth) |
| 6 | Performance, accessibility, deployment prep | ✅ Done |

**The single most important thing to know before going further:** there is no real database yet. Everything — reports, the moderation queue, confirmation dedup, rate limiting — lives in an in-memory store that resets every time the server restarts and does not work across multiple server instances. This is fine for local development and demoing, and is **not fine** for any real traffic. See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for what's required before that changes, and `PROJECT_CONTEXT.md` for the full list of gaps, judgment calls, and bugs-found-and-fixed across every phase.

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template and fill in what you have
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs immediately with generated demo data — no Supabase project or API keys are required to explore the UI, submit a test report, or use the map.

To access the moderation dashboard at `/admin`, set `ADMIN_API_SECRET` in `.env.local` first (see [`DEPLOYMENT.md`](./DEPLOYMENT.md)).

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (config lives in `app/globals.css`, not a `tailwind.config.ts` — this is a v4 project)
- **UI primitives:** Hand-built, shadcn/ui-compatible components in `components/ui/`
- **Maps:** MapLibre GL JS + OpenStreetMap tiles, dynamically imported to keep it out of the initial bundle
- **Geocoding:** OSM Nominatim (free, no API key, rate-limited — see gaps below)
- **Data fetching:** TanStack Query
- **Forms:** React Hook Form + Zod
- **Backend (intended):** Supabase (PostgreSQL + PostGIS) — **not yet provisioned**; the app currently runs on an in-memory store, see above

## Project Structure

```
app/                    Next.js App Router pages and API routes
  api/                  Route handlers (report submission, moderation, etc.)
  incident/[id]/        Report detail pages
  report/                Report submission form page
  admin/                 Moderation dashboard (interim-auth gated)
components/
  ui/                    Hand-built shadcn-style primitives
  map/                    MapLibre map + dynamic-import wrappers
  report/                 Report form and its subcomponents
  admin/                  Admin auth context, login gate, dashboard
lib/
  report-store.ts         TEMPORARY in-memory data store (see warnings above)
  report-privacy.ts       Location offset + edit-code hashing (privacy-critical)
  trust-score.ts           Submission-time trust assessment / flagging
  admin-auth.ts            Interim shared-secret admin auth
  map/                     Geocoding, GeoJSON conversion, safety score calc
docs/                    The four source-of-truth PRD/architecture documents
types/                   Shared TypeScript domain types
PROJECT_CONTEXT.md       Full phase-by-phase build log: decisions, gaps, bugs found
DEPLOYMENT.md            What's needed to actually deploy this
```

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Run the production build locally
npm run lint      # ESLint
```

Type-checking isn't a separate npm script but can be run directly:

```bash
npx tsc --noEmit
```

## Documentation

- **[`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md)** — the most important file in this repo if you're picking up this project. A full, honest log of what's built, what's stubbed, every architectural judgment call, and three real bugs that were found (and how) across the build phases. Read this before making changes.
- **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** — what's required to take this from local scaffold to a real deployment: Supabase setup, environment variables, the auth upgrade path, and known blockers.
- **`docs/`** — the four original product/architecture/design specification documents this build follows.

## A Note on Scope

This codebase deliberately documents its own gaps rather than hiding them. Where something is simplified, mocked, or a placeholder, the code comments and `PROJECT_CONTEXT.md` say so explicitly — including a few things worth flagging before anyone treats this as launch-ready:

- **No real database.** Everything resets on server restart.
- **Admin auth is a single shared secret**, not per-moderator accounts.
- **Trust scoring is a simplified subset** of what the architecture doc specifies — no duplicate-detection, no VPN signal, no cross-report clustering.
- **Photos are processed (EXIF-stripped, compressed) but never actually uploaded anywhere** — there's no storage backend yet.
- **The core moderation-policy question is still open**: a platform that publishes anonymous safety allegations about specific locations carries real defamation/harassment-campaign risk, and this scaffold's trust-scoring is not a substitute for a real content-moderation policy or legal review. This was flagged from the very first build session and remains unresolved — see `PROJECT_CONTEXT.md`.

None of this is a reason not to use the scaffold — it's exactly what a Phase 1–6 MVP build should produce. It is a reason to treat `PROJECT_CONTEXT.md` as required reading before deploying this anywhere real users can reach it.
