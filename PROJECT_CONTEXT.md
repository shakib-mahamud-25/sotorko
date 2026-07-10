# PROJECT_CONTEXT.md — Sotorko

**Last updated:** Phase 6 completion (performance, accessibility, deployment prep) — full Phase 1–6 roadmap complete
**Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, Supabase (not yet provisioned), MapLibre GL, TanStack Query, React Hook Form + Zod

This file is the single most important document in this repository if you're picking up the project. It's a phase-by-phase log of what was built, every architectural judgment call and why, and every real bug found during development — including how it was found, since the *how* is often as useful as the fix.

---

## Phases 1–5 summary

Full UI shell + design system (P1) → real MapLibre map, geocoding search, client-side Safety Score, filters (P2) → complete anonymous reporting flow with verified privacy-critical logic: 5–15m location offset, EXIF/GPS stripping, hashed edit codes (P3) → community confirmations + single-source data model (P4) → trust scoring, moderation queue, admin dashboard behind an interim auth gate (P5). Each phase's detailed notes, including three real bugs found and fixed during Phase 5 (cross-module-instance store access, a protocol-detection bug, and a proxy crash), are preserved in git history / prior delivered snapshots of this file. The headline items from each carry forward into the gaps list below.

## Phase 6 — Performance, accessibility, deployment prep (this phase)

### Accessibility

- **Custom widget groups now have proper label association.** `report-form.tsx`'s location picker, category selector, and severity selector are custom widgets (a map, chip buttons, styled radio buttons) — not native form controls a `<label for>` can point at. Fixed using `aria-labelledby` pointing at an explicit `id` on each `Label`, which is the correct pattern for grouped custom widgets. Also added `role="alert"` to every inline validation error so screen readers announce them when they appear, not just visually.

- **The location picker's map click/drag interaction has no keyboard equivalent — this is a structural fact about canvas-rendered maps, not something that can be patched with an aria attribute.** Rather than pretend otherwise, added a genuine keyboard-operable alternative: a text search box (reusing the same Nominatim geocoder already used elsewhere) that sets the exact same `{lat, lng}` value the map interactions produce. This is a real equivalent path, not a token gesture.

- **Same structural issue on the homepage map** (clicking a pin has no keyboard path — MapLibre doesn't expose individual pins as focusable DOM nodes). The "Recent Reports" list below the map already showed the same underlying data as clickable, keyboard-navigable cards linking to full detail pages — this existed since Phase 2/4, not added this phase — but there was no explicit signal connecting the two. Added a screen-reader-only note near the map pointing to that section as the accessible equivalent.

- **`loading.tsx` boundaries added** for `/incident/[id]` (skeleton matching the eventual layout) — see the Testing Methodology note below for an important side effect of this change.

### Performance

- **MapLibre GL (~1MB) was being eagerly bundled into both the homepage and report-form page JS**, even though it's a large library that reads `window` at import time and can't be server-rendered anyway. Converted both consumers (`components/map/map-container.tsx`, `components/report/location-picker.tsx`) to `next/dynamic` with `ssr: false`. Verified by inspecting the actual build output: the homepage's initial HTML no longer references either ~1MB MapLibre chunk — they're now fetched only once the dynamic import resolves client-side. Estimated initial JS payload for the homepage dropped roughly 70%, based on direct inspection of `.next/static/chunks/` and cross-referencing which chunks the prerendered HTML actually requests upfront.

- **Loading states added** for the homepage's initial report fetch (skeleton cards instead of a silent empty section while `useQuery` is loading) and the incident detail route (`loading.tsx`, a route-level Suspense boundary — the correct pattern for a Server Component page fetching data, versus a client-side skeleton).

- **Short-lived cache headers added to public API routes.** `GET /api/reports` now sends `Cache-Control: public, s-maxage=10, stale-while-revalidate=30`. Moderator-facing routes (`GET /api/admin/moderation`, `GET /api/admin/stats`) were explicitly set to `Cache-Control: no-store` instead — auth-gated data should never be cached by an intermediate proxy. `GET /api/report/[id]` was deliberately left uncached: the incident detail page already calls it with `{ cache: "no-store" }`, and a moderator's "remove" decision should be reflected on the very next page load for a safety product — correctness was judged more important than the marginal performance gain there.

### The important part: what was found while testing this phase's own changes

**A genuine regression scare that turned out to be a testing artifact, but revealed a real methodology gap.** After adding `loading.tsx` for the incident detail route, a `curl -o /dev/null -w "%{http_code}"` check against a `pending_review` report's detail page started returning `200` instead of the expected `404` — appearing to be a full regression of the moderation gate fixed carefully in Phase 5. Investigation (checking the actual response body, not just the status line) revealed the true cause: **`loading.tsx` introduces a React Suspense streaming boundary, and Next.js sends the HTTP status line before it knows the page's final resolved status when a route streams.** The actual page content correctly contained a `NEXT_HTTP_ERROR_FALLBACK;404` marker later in the same response body — `notFound()` was firing exactly as intended the entire time. The moderation gate was never broken. What *was* broken: every `curl -o /dev/null -w "%{http_code}"` check run against `/incident/[id]` became unreliable the moment this phase added the loading boundary, because that check only looks at the status line. Fixed by switching all detail-page verification to check actual response body content instead of trusting the status code. This is documented in `DEPLOYMENT.md`'s verification section so it doesn't cause the same false alarm for whoever deploys this next.

Full regression suite re-run in both `next dev` and a production `next build && next start` after all Phase 6 changes, using the corrected body-content-based verification method — homepage, report form, mock incident detail, 404 handling, admin gate, about/privacy/terms pages, and the full submit → flag → hide → approve → visible moderation cycle. All passed cleanly with no server-side errors in the logs.

## Known gaps / next steps

Consolidated and current as of the end of Phase 6 — see `DEPLOYMENT.md` for the actionable version with concrete steps for each item.

1. **No real database.** The single biggest gap. Everything — reports, moderation queue, confirmation dedup, rate limiting, submission-velocity tracking — lives in an in-memory store (`lib/report-store.ts`) that resets on restart and, worse, is not guaranteed to behave consistently across multiple serverless instances (e.g. on Vercel). See `DEPLOYMENT.md`'s explicit warning about what breaks on serverless specifically.
2. **Admin auth is a single shared secret**, not per-moderator Supabase Auth accounts. Documented as explicitly interim in `lib/admin-auth.ts` since Phase 5; upgrade path detailed in `DEPLOYMENT.md`.
3. **Trust score signal set is simplified** — submission velocity and severity-without-corroboration only. No duplicate-description detection, VPN signal, or geographic clustering; all three need either a real database or an external signal source.
4. **Photos are processed but never uploaded anywhere.** EXIF-stripping and compression happen correctly client-side (`lib/image-processing.ts`), but `report-form.tsx` explicitly discards the resulting files before submission rather than faking an upload. Needs Supabase Storage + a signed-URL upload flow.
5. **Edit/delete UI doesn't exist in the frontend** — the `/api/report/edit` endpoint works and has been repeatedly verified, but nothing in the UI calls it.
6. **"Merge" moderation decision doesn't actually merge report data** — it's currently just a status flag. The architecture doc doesn't specify merge semantics in enough detail to implement confidently, so this was left honest rather than guessed at.
7. **Nominatim/OSM tile fair-use limits** — fine for development, need a paid or self-hosted alternative before real production traffic.

## Open product/legal question — still flagged, still not resolved

Unchanged in substance since Phase 1, though technically better-supported now: Sotorko's core function is publishing anonymous, unverified safety allegations about specific locations. Phase 5 added a real (if simplified) trust-score gate before publication, which is genuine progress — but it is not a content-moderation policy and has not had legal review. Bangladesh's Cyber Security Act 2023 was flagged as potentially relevant from the very first build session. This remains a product/legal decision for a human to make, not something the codebase can resolve on its own. See `DEPLOYMENT.md` for this framed as an actionable pre-launch checklist item.

## Environment quirks worth knowing

- **Tailwind v4** — no `tailwind.config.ts`; all theme tokens live in `app/globals.css`.
- **Next.js 16** — middleware is `proxy.ts` / `export async function proxy()`, not `middleware.ts`.
- **Zod 4** is installed, not Zod 3 — API surface is mostly compatible but double-check against the installed version if working from memory/older docs.
- `next/font/google` needs network access unavailable in the sandbox this was built in — verified every phase by temporarily stubbing the font call, confirming the build succeeds, then restoring the real Inter setup. Not a code problem; will work normally with standard internet access.
- **`app/incident/[id]/loading.tsx` means naive `curl -o /dev/null -w "%{http_code}"` checks against detail pages are unreliable** — see the Phase 6 section above and `DEPLOYMENT.md`'s verification guidance. Check response body content, not the HTTP status line, for any route with a `loading.tsx` streaming boundary.
- **This project was tested throughout development by actually running `npm run dev` and `npm run build && npm run start` and hitting real routes with curl** — not by trusting `tsc`/`eslint`/`next build` alone. This caught multiple real bugs across Phases 3, 5, and 6 that static checks alone would have missed. If extending this project, the same practice is strongly recommended, especially for anything touching the store, auth, or moderation logic.
