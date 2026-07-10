/**
 * Domain types for Sotorko. These mirror the entities defined in
 * docs/02-Architecture.md §4 and are the shared contract between
 * frontend components, API routes, and Supabase queries.
 */

export type IncidentCategory =
  | "catcalling"
  | "verbal_harassment"
  | "following_stalking"
  | "groping"
  | "sexual_harassment"
  | "suspicious_individuals"
  | "poor_lighting"
  | "theft"
  | "unsafe_transport"
  | "other";

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  catcalling: "Catcalling",
  verbal_harassment: "Verbal Harassment",
  following_stalking: "Following / Stalking",
  groping: "Groping",
  sexual_harassment: "Sexual Harassment",
  suspicious_individuals: "Suspicious Individuals",
  poor_lighting: "Poor Lighting / Isolated Area",
  theft: "Theft / Attempted Theft",
  unsafe_transport: "Unsafe Public Transport",
  other: "Other",
};

export type Severity = "low" | "moderate" | "high" | "severe";

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
};

export type ReportStatus =
  | "published"
  | "pending_review"
  | "archived"
  | "removed"
  | "merged";

export type FlagReason =
  | "low_trust_score"
  | "rate_limit_pattern"
  | "duplicate_description"
  | "duplicate_location"
  | "no_confirmations_high_severity";

export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  low_trust_score: "Low trust score",
  rate_limit_pattern: "Rapid submission pattern",
  duplicate_description: "Similar description to another report",
  duplicate_location: "Duplicate location, same window",
  no_confirmations_high_severity: "High severity, no confirmations yet",
};

export type ModeratorDecision = "approve" | "archive" | "remove" | "merge";

export interface ModerationQueueEntry {
  queueId: string;
  reportId: string;
  flagReasons: FlagReason[];
  moderatorDecision: ModeratorDecision | null;
  notes?: string;
  createdAt: string;
  decidedAt?: string;
}

export type ConfirmationType =
  | "experienced_similar"
  | "still_unsafe"
  | "conditions_improved";

export interface Report {
  id: string;
  /** Only ever present in the response immediately after creation. */
  editCode?: string;
  latitude: number;
  longitude: number;
  displayLatitude: number;
  displayLongitude: number;
  categories: IncidentCategory[];
  severity: Severity;
  description?: string;
  incidentDate: string; // ISO date
  incidentTime?: string; // HH:mm
  status: ReportStatus;
  trustScore: number;
  confirmationCounts: Record<ConfirmationType, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Confirmation {
  id: string;
  reportId: string;
  confirmationType: ConfirmationType;
  createdAt: string;
}

export type SafetyLevel = "safe" | "mostly_safe" | "caution" | "unsafe" | "avoid";

export interface SafetyScore {
  score: number; // 0-100
  level: SafetyLevel;
  recentIncidentCount: number;
  trend: "improving" | "worsening" | "stable";
  lastUpdated: string;
}

export function safetyLevelFromScore(score: number): SafetyLevel {
  if (score >= 85) return "safe";
  if (score >= 70) return "mostly_safe";
  if (score >= 50) return "caution";
  if (score >= 30) return "unsafe";
  return "avoid";
}

export const SAFETY_LEVEL_LABELS: Record<SafetyLevel, string> = {
  safe: "Safe",
  mostly_safe: "Mostly Safe",
  caution: "Caution",
  unsafe: "Unsafe",
  avoid: "Avoid if Possible",
};

export interface ReportFilters {
  categories?: IncidentCategory[];
  severity?: Severity[];
  timeRange?: "6m" | "12m" | "2y" | "all";
  dayNight?: "day" | "night" | "all";
  viewMode?: "heatmap" | "pins";
}

export interface Statistics {
  incidentsToday: number;
  mostDangerousAreas: { name: string; score: number }[];
  trendingHotspots: { name: string; changePercent: number }[];
  dayVsNight: { day: number; night: number };
  weeklyTrend: { date: string; count: number }[];
}
