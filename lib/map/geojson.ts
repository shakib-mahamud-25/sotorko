import type { Report, Severity } from "@/types";

/**
 * Severity mapped to a numeric weight for heatmap intensity.
 * Higher severity = more visual weight in the heatmap layer.
 */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 0.35,
  moderate: 0.6,
  high: 0.85,
  severe: 1,
};

export interface ReportFeatureProperties {
  id: string;
  severity: Severity;
  weight: number;
  categories: string;
  incidentDate: string;
}

export type ReportFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  ReportFeatureProperties
>;

/**
 * Converts reports into a GeoJSON FeatureCollection using DISPLAY
 * coordinates only. Exact coordinates must never reach the client —
 * this function is the enforcement point for that rule on the
 * frontend side (server-side, the API must never send exact lat/lng
 * to unauthenticated requests either).
 */
export function reportsToGeoJSON(reports: Report[]): ReportFeatureCollection {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.displayLongitude, r.displayLatitude],
      },
      properties: {
        id: r.id,
        severity: r.severity,
        weight: SEVERITY_WEIGHT[r.severity],
        categories: r.categories.join(","),
        incidentDate: r.incidentDate,
      },
    })),
  };
}
