import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * TEMPORARY admin auth: a shared secret passed as a bearer token,
 * checked against an environment variable.
 *
 * This is NOT the real admin auth model. Architecture §2/§6 specify
 * Supabase Auth (admin-only) with per-moderator accounts, audit trail
 * of who made which decision, and RLS-enforced access to exact
 * coordinates and moderation-only fields. A shared secret gives none
 * of that — every moderator would look identical, there's no
 * revocation short of rotating the secret for everyone, and it can't
 * distinguish moderator roles.
 *
 * What it DOES give, which matters given the moderation queue exposes
 * exact-location-adjacent report details: the endpoints aren't
 * unauthenticated. Shipping Phase 5's moderation API with zero auth
 * at all — reachable by anyone who finds the URL — was judged worse
 * than a real-but-thin gate, given that /docs/04 lists "Server-side
 * validation" and "Environment variables" as explicit security
 * requirements. This satisfies that bar; it does not satisfy the
 * "Authentication (Admin only)" bar from the backend services list,
 * which still needs real Supabase Auth before this handles real
 * traffic — see PROJECT_CONTEXT.md.
 */
export function isAuthorizedAdmin(request: NextRequest): boolean {
  const configured = process.env.ADMIN_API_SECRET;
  if (!configured) {
    // No secret configured at all means the interim gate can't do
    // its job — fail closed rather than silently allow everyone.
    return false;
  }

  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!provided) return false;

  // Constant-time comparison so response timing can't leak how many
  // leading characters of the secret matched.
  const a = Buffer.from(provided);
  const b = Buffer.from(configured);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
