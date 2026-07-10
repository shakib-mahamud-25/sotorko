"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportFilters } from "@/types";

const TIME_RANGES: { value: NonNullable<ReportFilters["timeRange"]>; label: string }[] = [
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "2y", label: "Last 2 years" },
  { value: "all", label: "All time" },
];

const DAY_NIGHT: { value: NonNullable<ReportFilters["dayNight"]>; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
];

export function FilterBar({
  filters,
  onChange,
}: {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-card p-3">
      <span className="flex items-center gap-1.5 pl-1 pr-2 text-sm font-medium text-muted-foreground">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
      </span>

      <select
        aria-label="Filter by time range"
        value={filters.timeRange ?? "12m"}
        onChange={(e) =>
          onChange({ ...filters, timeRange: e.target.value as ReportFilters["timeRange"] })
        }
        className="h-9 rounded-button border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {TIME_RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by day or night"
        value={filters.dayNight ?? "all"}
        onChange={(e) =>
          onChange({ ...filters, dayNight: e.target.value as ReportFilters["dayNight"] })
        }
        className="h-9 rounded-button border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {DAY_NIGHT.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      {(filters.categories?.length || filters.severity?.length) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...filters, categories: [], severity: [] })}
        >
          Clear category/severity
        </Button>
      )}
    </div>
  );
}
