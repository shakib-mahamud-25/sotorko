import type { Report, SafetyScore, Statistics } from "@/types";

/**
 * Placeholder data so the homepage is fully visible/testable during
 * Phase 1 (UI shell). Replace with real API calls in Phase 2+
 * (see lib/api/).
 */

export const mockSafetyScore: SafetyScore = {
  score: 62,
  level: "caution",
  recentIncidentCount: 7,
  trend: "worsening",
  lastUpdated: new Date().toISOString(),
};

export const mockStatistics: Statistics = {
  incidentsToday: 4,
  mostDangerousAreas: [
    { name: "Farmgate", score: 34 },
    { name: "Mohakhali", score: 41 },
    { name: "Gulistan", score: 28 },
  ],
  trendingHotspots: [
    { name: "Uttara Sector 7", changePercent: 22 },
    { name: "Mirpur 10", changePercent: 15 },
  ],
  dayVsNight: { day: 38, night: 62 },
  weeklyTrend: [
    { date: "Mon", count: 3 },
    { date: "Tue", count: 5 },
    { date: "Wed", count: 2 },
    { date: "Thu", count: 6 },
    { date: "Fri", count: 8 },
    { date: "Sat", count: 4 },
    { date: "Sun", count: 3 },
  ],
};

export const mockRecentReports: Report[] = [
  {
    id: "r1",
    latitude: 23.7509,
    longitude: 90.3935,
    displayLatitude: 23.7512,
    displayLongitude: 90.3931,
    categories: ["catcalling", "verbal_harassment"],
    severity: "moderate",
    description:
      "Group of men made repeated comments near the bus stop around evening rush hour.",
    incidentDate: new Date(Date.now() - 86400000).toISOString(),
    incidentTime: "19:30",
    status: "published",
    trustScore: 0.82,
    confirmationCounts: {
      experienced_similar: 4,
      still_unsafe: 2,
      conditions_improved: 0,
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "r2",
    latitude: 23.7806,
    longitude: 90.4193,
    displayLatitude: 23.7809,
    displayLongitude: 90.4188,
    categories: ["poor_lighting", "suspicious_individuals"],
    severity: "high",
    description: "Street lights have been out for weeks; felt unsafe walking alone.",
    incidentDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    incidentTime: "21:15",
    status: "published",
    trustScore: 0.75,
    confirmationCounts: {
      experienced_similar: 6,
      still_unsafe: 5,
      conditions_improved: 0,
    },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "r3",
    latitude: 23.7461,
    longitude: 90.3742,
    displayLatitude: 23.7458,
    displayLongitude: 90.3745,
    categories: ["unsafe_transport"],
    severity: "low",
    incidentDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "published",
    trustScore: 0.6,
    confirmationCounts: {
      experienced_similar: 1,
      still_unsafe: 0,
      conditions_improved: 1,
    },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  ...generateReportCluster(),
];

/**
 * Generates a spread of mock reports around a handful of real Dhaka
 * areas so the map/heatmap has realistic density to render during
 * Phase 2 development. Deterministic (seeded) so output is stable
 * across reloads instead of jittering on every render.
 */
function generateReportCluster(): Report[] {
  const centers: { name: string; lat: number; lng: number; count: number }[] = [
    { name: "Farmgate", lat: 23.7581, lng: 90.3897, count: 8 },
    { name: "Mohakhali", lat: 23.7806, lng: 90.4023, count: 6 },
    { name: "Gulistan", lat: 23.7104, lng: 90.4074, count: 7 },
    { name: "Uttara Sector 7", lat: 23.8759, lng: 90.3795, count: 5 },
    { name: "Mirpur 10", lat: 23.8069, lng: 90.3687, count: 6 },
    { name: "Dhanmondi 27", lat: 23.7461, lng: 90.3742, count: 4 },
    { name: "Shahbagh", lat: 23.7382, lng: 90.3954, count: 3 },
  ];

  const categories: Report["categories"] = [
    "catcalling",
    "verbal_harassment",
    "following_stalking",
    "poor_lighting",
    "suspicious_individuals",
    "theft",
    "unsafe_transport",
  ];
  const severities: Report["severity"][] = ["low", "moderate", "high", "severe"];

  let seed = 42;
  const rand = () => {
    // simple LCG for deterministic pseudo-randomness
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const reports: Report[] = [];

  centers.forEach((center, ci) => {
    for (let i = 0; i < center.count; i++) {
      const jitterLat = (rand() - 0.5) * 0.012;
      const jitterLng = (rand() - 0.5) * 0.012;
      const offsetLat = (rand() - 0.5) * 0.0002; // ~5-15m
      const offsetLng = (rand() - 0.5) * 0.0002;
      const daysAgo = Math.floor(rand() * 180);
      const cat1 = categories[Math.floor(rand() * categories.length)];
      const cat2 = rand() > 0.6 ? categories[Math.floor(rand() * categories.length)] : null;

      const lat = center.lat + jitterLat;
      const lng = center.lng + jitterLng;
      const isNight = rand() > 0.4;

      reports.push({
        id: `gen-${ci}-${i}`,
        latitude: lat,
        longitude: lng,
        displayLatitude: lat + offsetLat,
        displayLongitude: lng + offsetLng,
        categories: cat2 && cat2 !== cat1 ? [cat1, cat2] : [cat1],
        severity: severities[Math.floor(rand() * severities.length)],
        incidentDate: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        incidentTime: isNight ? "21:40" : "13:15",
        status: "published",
        trustScore: 0.5 + rand() * 0.45,
        confirmationCounts: {
          experienced_similar: Math.floor(rand() * 8),
          still_unsafe: Math.floor(rand() * 5),
          conditions_improved: Math.floor(rand() * 2),
        },
        createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      });
    }
  });

  return reports;
}
