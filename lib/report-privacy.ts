import { randomBytes, createHash } from "crypto";

/**
 * Applies a randomized 5–15 meter offset to a coordinate pair for
 * public display, per PRD §6 "Privacy Protection" and Architecture
 * §9. The EXACT coordinates must be stored separately and never
 * returned to unauthenticated clients — this function only produces
 * the DISPLAY coordinates that are safe to expose.
 *
 * Must run server-side only. If this logic runs client-side, a user
 * could bypass it and submit fabricated "safe" display coordinates,
 * or a moderator-facing bug could leak the offset algorithm in a way
 * that lets someone reverse-engineer exact locations from enough
 * samples — keeping this server-only limits that exposure.
 */
export function applyPrivacyOffset(
  latitude: number,
  longitude: number
): { displayLatitude: number; displayLongitude: number } {
  const minMeters = 5;
  const maxMeters = 15;

  // Random distance within [minMeters, maxMeters], random bearing.
  const distance = minMeters + Math.random() * (maxMeters - minMeters);
  const bearing = Math.random() * 2 * Math.PI;

  const earthRadiusM = 6378137;
  const latRad = (latitude * Math.PI) / 180;

  const deltaLat = (distance * Math.cos(bearing)) / earthRadiusM;
  const deltaLng =
    (distance * Math.sin(bearing)) / (earthRadiusM * Math.cos(latRad));

  return {
    displayLatitude: latitude + (deltaLat * 180) / Math.PI,
    displayLongitude: longitude + (deltaLng * 180) / Math.PI,
  };
}

/**
 * Generates a human-typeable anonymous edit code (e.g. for editing
 * or deleting a report later without an account). Shown to the user
 * exactly once at submission time — only the HASH is stored server-
 * side (see hashEditCode below), per Architecture §9 "Anonymous edit
 * codes are stored only as hashed values."
 *
 * Format: 3 groups of 4 alphanumeric chars, avoiding visually
 * ambiguous characters (0/O, 1/I/l) so it's easy to write down and
 * re-type correctly.
 */
const SAFE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateEditCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < 3; g++) {
    let group = "";
    const bytes = randomBytes(4);
    for (let i = 0; i < 4; i++) {
      group += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length];
    }
    groups.push(group);
  }
  return groups.join("-");
}

/**
 * Hashes an edit code for storage. Uses SHA-256 with a static pepper
 * from the environment (not a per-record salt, since edit codes are
 * high-entropy random strings, not user-chosen passwords — the
 * threat model here is "don't store the plaintext code", not
 * "resist rainbow tables against low-entropy input").
 */
export function hashEditCode(code: string): string {
  const pepper = process.env.EDIT_CODE_PEPPER ?? "sotorko-dev-pepper-change-in-prod";
  return createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

export function verifyEditCode(code: string, hash: string): boolean {
  return hashEditCode(code) === hash;
}
