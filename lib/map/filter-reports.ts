import type { Report, ReportFilters } from "@/types";

const TIME_RANGE_DAYS: Record<NonNullable<ReportFilters["timeRange"]>, number | null> = {
  "6m": 182,
  "12m": 365,
  "2y": 730,
  all: null,
};

function isNightTime(time?: string): boolean {
  if (!time) return false;
  const [hourStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  return hour >= 19 || hour < 6;
}

export function applyReportFilters(reports: Report[], filters: ReportFilters): Report[] {
  const maxAgeDays = filters.timeRange ? TIME_RANGE_DAYS[filters.timeRange] : null;
  const now = Date.now();

  return reports.filter((report) => {
    if (maxAgeDays !== null) {
      const ageDays = (now - new Date(report.incidentDate).getTime()) / 86400000;
      if (ageDays > maxAgeDays) return false;
    }

    if (filters.categories && filters.categories.length > 0) {
      const hasCategory = report.categories.some((c) => filters.categories!.includes(c));
      if (!hasCategory) return false;
    }

    if (filters.severity && filters.severity.length > 0) {
      if (!filters.severity.includes(report.severity)) return false;
    }

    if (filters.dayNight && filters.dayNight !== "all") {
      const night = isNightTime(report.incidentTime);
      if (filters.dayNight === "night" && !night) return false;
      if (filters.dayNight === "day" && night) return false;
    }

    return true;
  });
}
