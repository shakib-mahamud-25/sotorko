# Deployment Guide

This guide covers two things: (1) how to deploy the app **as it exists right now** — a working demo running on an in-memory store — and (2) what's actually required before this should handle real user data and real traffic. Read the [Before Real Traffic](#before-real-traffic) section before pointing this at real users; deploying it in its current form to production is fine for a demo or stakeholder review, and not fine as the platform's real launch.

---

## Quick Deploy (demo / staging, in-memory data)

This gets the app live on Vercel in a few minutes, running on generated demo data with the in-memory store from `lib/report-store.ts`. Good for showing people the product. **Data will reset on every deploy and does not persist reliably in a serverless environment** — see the warning below.

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Framework preset should auto-detect as Next.js.
3. Add environment variables (Project Settings → Environment Variables):

   | Variable | Required for quick deploy? | Value |
   |---|---|---|
   | `ADMIN_API_SECRET` | Yes, if you want `/admin` to work | A long random string — generate with `openssl rand -hex 32` |
   | `EDIT_CODE_PEPPER` | Recommended | Another long random string — see warning below |
   | `NEXT_PUBLIC_SUPABASE_URL` | No (not yet used) | Leave blank |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (not yet used) | Leave blank |

4. Deploy.

### ⚠️ Critical limitation of this deployment mode

**The in-memory store (`lib/report-store.ts`) does not reliably work on Vercel's serverless infrastructure.** Vercel functions are not guaranteed to be the same process between requests — in fact, they usually aren't. This means:

- A report submitted in one request may not be visible in the next, because a different serverless instance handled it.
- The moderation queue, rate limiter, and confirmation dedup all have the same problem.
- This is the *same class of bug* documented in `PROJECT_CONTEXT.md` Phase 5 (the cross-module-instance issue that was found and worked around for Server Component ↔ Route Handler communication *within a single process* during local testing) — except on Vercel, there may not even be a single process to share.

**What this deployment mode is good for:** showing people the UI, the map, the design, the flow — as long as you accept that data may not persist or be consistent between page loads. **What it is not good for:** any real usage, any demo where you submit a report and then expect to reliably see it again, or anything beyond a first look.

If you need reports to reliably persist through a demo, either (a) run it on a single long-lived server instead of Vercel (see "Self-hosted / single-instance" below), or (b) do the Supabase migration first (see below).

### Self-hosted / single-instance alternative

If you have a VM, a Droplet, a Railway/Render/Fly.io deployment, or anything that runs as one continuous Node process rather than spinning up fresh serverless instances per request, the in-memory store will behave consistently for the lifetime of that process (until restart). This is a more honest way to demo the full flow — including moderation — than serverless.

```bash
npm run build
npm run start
```

Put this behind a reverse proxy (Caddy, nginx) for TLS. Set `ADMIN_API_SECRET` and `EDIT_CODE_PEPPER` as real environment variables on the host, not in a committed file.

---

## Before Real Traffic

This is the actual list. Treat it as a checklist, not a suggestion.

### 1. Provision Supabase and migrate off the in-memory store

This is the single highest-priority item — it's also what fixes the "does not work on serverless" problem above, because a real Postgres database doesn't care which serverless instance is asking.

1. Create a project at [supabase.com](https://supabase.com).
2. Enable the PostGIS extension (Database → Extensions → postgis).
3. Create tables matching `docs/02-Architecture.md` §4:
   - `reports` (with `latitude`, `longitude`, `display_latitude`, `display_longitude` as PostGIS `geography(Point)` columns if you want spatial queries; `edit_code_hash`, `status`, `trust_score`, etc. — see `types/index.ts`'s `Report` interface for the full field list already used throughout the app)
   - `report_categories` (join table, since a report can have multiple categories)
   - `confirmations` (with a **unique constraint** on `(report_id, browser_fingerprint_hash, confirmation_type)` — this replaces the in-memory `confirmationDedup` Set in `lib/report-store.ts` and is a hard requirement, not optional, or the dedup logic won't hold under concurrent requests)
   - `moderation_queue` (see `ModerationQueueEntry` in `types/index.ts`)
4. Set up Row Level Security:
   - `reports`: public `SELECT` only where `status = 'published'`, and only non-exact-coordinate columns should be selectable by the anonymous role (exact `latitude`/`longitude` should require a service-role or moderator-scoped query — this is currently enforced in application code via `toPublicReport()` in `lib/report-store.ts`; RLS should enforce the same boundary at the database level too, not instead of).
   - `reports`: public `INSERT` allowed (anonymous reporting is a core product requirement).
   - `reports`: `UPDATE`/`DELETE` should be restricted to a Postgres function that verifies the edit-code hash server-side, not a client-editable row policy.
   - `moderation_queue`, and any column exposing exact coordinates: service-role only.
5. Replace every function in `lib/report-store.ts` with real Supabase queries. The function signatures were deliberately written to match what the Supabase-backed versions should look like (see the comment block at the top of that file), so this should be closer to a rewrite of the function bodies than a redesign of every caller.
6. Regenerate `types/database.ts`:
   ```bash
   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
   ```
7. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in your deployment environment.
8. Once this is done, `proxy.ts`'s guard for "Supabase env vars aren't set" (added in Phase 6 after that exact scenario crashed every `/admin` request — see `PROJECT_CONTEXT.md`) becomes unnecessary and can be removed, since the vars will always be present.

### 2. Replace interim admin auth with real Supabase Auth

Current state: `/api/admin/*` routes are gated by a single shared secret (`ADMIN_API_SECRET`), checked in `lib/admin-auth.ts`. This is explicitly documented there as **not** the intended final auth model. Before real moderators use this:

1. Set up Supabase Auth with a `moderators` table (or a role/claim on the standard `auth.users` table).
2. Build a real login page using `@supabase/ssr`'s browser client (already installed — see `lib/supabase/client.ts`).
3. Replace `isAuthorizedAdmin()` in `lib/admin-auth.ts` with a check against the authenticated Supabase session and moderator role, instead of a bearer-token string comparison.
4. Re-enable `proxy.ts`'s session-refresh logic unconditionally (it's currently guarded off — see item 8 above and the comment in `proxy.ts`).
5. Add moderator identity to moderation decisions — right now `decideModerationEntry()` in `lib/report-store.ts` records a freeform `notes` string but no moderator identity at all. Add a `moderator_id` column and pass the authenticated user's id through.
6. Remove `components/admin/admin-auth-context.tsx`'s in-memory-secret pattern in favor of relying on Supabase's own session/cookie handling.

### 3. Photo upload to real storage

`components/report/photo-uploader.tsx` and `lib/image-processing.ts` already do the privacy-critical work (EXIF/GPS stripping via canvas re-encode, done entirely client-side before any network request). What's missing is the actual upload:

1. Set up a private Supabase Storage bucket.
2. Add an API route that returns a signed upload URL for an authenticated (anonymous-but-rate-limited) request.
3. Upload the already-processed `File[]` directly from the client using that signed URL.
4. Store only the resulting storage path against the report, not the file itself.
5. Ensure the bucket's access policy matches PRD §6: photos are visible only to moderators, never publicly.

Currently, `components/report/report-form.tsx` explicitly discards the processed photo files before submission (`const { photos: _photos, ...payload } = values`) rather than pretending to upload them — this was a deliberate choice to leave the gap honest instead of faking success. Search for that line when wiring up real upload.

### 4. Real abuse detection / trust scoring

`lib/trust-score.ts` implements a simplified subset of `docs/04-Technical-Architecture.md` §8's abuse signals — only submission velocity and severity-without-corroboration. Missing, and requiring a real database to implement:

- Duplicate/similar description detection (needs either a text-similarity query — Postgres `pg_trgm` extension is a reasonable starting point — or an external service).
- Cross-report geographic density clustering (this is where PostGIS's spatial queries actually earn their keep).
- VPN/proxy detection (needs an external IP-intelligence signal; there's no free reliable source for this).

### 5. Nominatim and OSM tile usage limits

The app currently uses OSM's free public Nominatim (geocoding) and tile server, both of which have fair-use policies (roughly 1 request/second, no heavy production traffic — see their respective usage policies). This is fine through development and light demo traffic. Before real usage:

- Either self-host a Nominatim instance, or switch to a paid geocoder (Google Places, Mapbox — both already anticipated in `docs/04-Technical-Architecture.md` §2 as "Future support").
- Same for tile serving — either self-host tiles or use a paid provider (Mapbox, MapTiler, etc.).

### 6. Legal review of the moderation model

Not a code task, but the most important item on this list. Sotorko's core function is publishing anonymous, unverified allegations about specific locations. As of Phase 5, there's a real (if simplified) trust-score gate before publication — that's meaningfully better than nothing, but it does not constitute a moderation policy, and nothing about this codebase has had legal review. Bangladesh's Cyber Security Act 2023 was flagged as potentially relevant from the very first build session and has not been evaluated by anyone with actual legal expertise. Get that review before this handles real allegations about real places.

---

## Environment Variable Reference

See `.env.example` for the full list with inline documentation. Summary:

| Variable | Scope | Required for | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Real database | Blank = app runs on in-memory store |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Real database | |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Real database, moderation | Never expose to client |
| `ADMIN_API_SECRET` | **Server only** | `/admin` access at all | Interim auth — see item 2 above. Without this set, `/admin` fails closed (nobody can log in) rather than failing open. |
| `EDIT_CODE_PEPPER` | **Server only** | Edit-code security | Falls back to a dev-only default if unset — **must** be set to a real random value before real reports are submitted, since changing it later invalidates every existing edit code |
| `NEXT_PUBLIC_SITE_URL` | Public | Usually unnecessary | Only needed if deploying behind a proxy that doesn't correctly forward `x-forwarded-proto`/`host` — the app falls back to constructing this from request headers otherwise |
| `NEXT_PUBLIC_MAP_TILES_URL` | Public | Optional | For a paid/self-hosted tile provider instead of the public OSM tile server |
| `CLOUDINARY_*` | **Server only** | Optional | Only if using Cloudinary instead of Supabase Storage for photos |

---

## Verifying a Deployment

A minimal smoke test after any deploy:

```bash
# Replace with your deployed URL
BASE_URL="https://your-deployment.vercel.app"

# Homepage loads
curl -s -o /dev/null -w "Homepage: %{http_code}\n" "$BASE_URL/"

# Report submission works
curl -s -X POST "$BASE_URL/api/report" \
  -H "Content-Type: application/json" \
  -d '{"latitude":23.75,"longitude":90.39,"categories":["theft"],"severity":"low","incidentDate":"2026-01-01"}'

# Public listing works
curl -s "$BASE_URL/api/reports" | head -c 200
```

If you've set `ADMIN_API_SECRET`, also verify the admin gate:

```bash
curl -s -o /dev/null -w "Unauthenticated admin API: %{http_code} (expect 401)\n" "$BASE_URL/api/admin/stats"
curl -s -H "Authorization: Bearer YOUR_SECRET" "$BASE_URL/api/admin/stats"
```

**Note on testing detail pages:** `app/incident/[id]/loading.tsx` introduces a React Suspense streaming boundary, which means a plain `curl -o /dev/null -w "%{http_code}"` check against `/incident/[id]` will often show `200` even for a page that resolves to a 404 — Next.js sends the HTTP status line before it knows the final resolution when a page streams. Check for actual page content instead:

```bash
curl -s "$BASE_URL/incident/some-id" | grep -o "Incident Details\|NEXT_HTTP_ERROR_FALLBACK"
```

This exact issue was found and documented during Phase 6 development — see `PROJECT_CONTEXT.md` for the full story if the discrepancy is confusing.
