/**
 * A deliberately LIGHTWEIGHT browser identifier, used only to dedupe
 * repeat community confirmations from the same browser (PRD/Architecture
 * both describe this as "browser fingerprint (privacy-conscious)").
 *
 * This is NOT a real fingerprinting library and does not attempt to
 * uniquely identify a person across sites, resist all evasion, or
 * survive a private/incognito session. It is a random, locally-
 * generated identifier persisted in localStorage — closer to an
 * anonymous cookie than a device fingerprint. That's an intentional
 * trade-off: strong fingerprinting techniques (canvas/audio/font
 * enumeration) are exactly the kind of invasive tracking Sotorko's
 * privacy-first principle argues against, even in service of abuse
 * prevention.
 *
 * The real abuse-detection system (Architecture §7) can layer
 * stronger signals server-side later; this only needs to be good
 * enough to stop someone from clicking "I experienced this too"
 * fifty times in a row.
 */

const STORAGE_KEY = "sotorko_browser_id";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getBrowserId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, disabled storage) —
    // fall back to a per-session id so confirmations still work,
    // just without cross-session dedup.
    return generateId();
  }
}
