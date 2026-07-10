/**
 * Minimal in-memory rate limiter, keyed by a caller-supplied
 * identifier (e.g. a hashed IP). This is intentionally basic — it
 * resets on server restart and doesn't work across multiple server
 * instances.
 *
 * This is NOT the abuse detection system described in Architecture
 * §7 / Technical Architecture §8 (browser fingerprint, duplicate
 * descriptions, trust scoring, etc.) — it's a first line of defense
 * against naive spam so the report endpoint isn't wide open while
 * that system is built out against real Supabase tables.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
