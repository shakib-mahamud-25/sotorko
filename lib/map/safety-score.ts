import type { Report, SafetyScore } from "@/types";
import { safetyLevelFromScore } from "@/types";

const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SEVERITY_PENALTY: Record<Report["severity"], number> = {
  low: 3,
  moderate: 7,
  high: 13,
  severe: 20,
};

/**
 * Simplified client-side Safety Score calculation for a given point,
 * considering reports within `radiusKm`. This mirrors the factors
 * described in Technical Architecture §10 (incident count, severity,
 * confirmations, time decay, geographic density, trust score) but is
 * intentionally basic — the real engine belongs server-side (a
 * Postgres function or Edge Function) once PostGIS is available, so
 * it can use proper spatial indexing and stay consistent across all
 * clients.
 *
 * This function exists so the UI has *something* real to show during
 * Phase 2, not a hardcoded mock number.
 */
export function calculateSafetyScore(
  reports: Report[],
  center: { lat: number; lng: number },
  radiusKm = 0.6
): SafetyScore {
  const nearby = reports.filter(
    (r) =>
      haversineDistanceKm(center.lat, center.lng, r.latitude, r.longitude) <=
      radiusKm
  );

  if (nearby.length === 0) {
    return {
      score: 90,
      level: "safe",
      recentIncidentCount: 0,
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    };
  }

  const now = Date.now();
  let totalPenalty = 0;

  for (const report of nearby) {
    const ageDays = (now - new Date(report.incidentDate).getTime()) / 86400000;
    // Time decay: linear falloff to ~20% weight by 180 days out.
    const decay = Math.max(0.2, 1 - ageDays / 225);

    const confirmations =
      (report.confirmationCounts?.experienced_similar ?? 0) +
      (report.confirmationCounts?.still_unsafe ?? 0) -
      (report.confirmationCounts?.conditions_improved ?? 0) * 1.5;
    const confirmationBoost = 1 + Math.min(0.5, Math.max(0, confirmations) * 0.05);

    totalPenalty +=
      SEVERITY_PENALTY[report.severity] *
      decay *
      confirmationBoost *
      Math.max(0.4, report.trustScore);
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));

  const recentCount = nearby.filter((r) => {
    const ageDays = (now - new Date(r.incidentDate).getTime()) / 86400000;
    return ageDays <= 90;
  }).length;
  const olderCount = nearby.length - recentCount;
  const trend: SafetyScore["trend"] =
    recentCount > olderCount * 1.2
      ? "worsening"
      : recentCount < olderCount * 0.8
        ? "improving"
        : "stable";

  return {
    score,
    level: safetyLevelFromScore(score),
    recentIncidentCount: recentCount,
    trend,
    lastUpdated: new Date().toISOString(),
  };
}
