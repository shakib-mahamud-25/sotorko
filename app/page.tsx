"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Moon, Sun, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { MapContainer } from "@/components/map/map-container";
import { ViewModeToggle } from "@/components/map/view-mode-toggle";
import { FilterBar } from "@/components/filters/filter-bar";
import { SafetyScoreCard } from "@/components/safety-score-card";
import { IncidentCard } from "@/components/incident-card";
import { StatCard } from "@/components/analytics/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapViewMode } from "@/lib/map/use-sotorko-map";
import type { GeocodeResult } from "@/lib/map/geocode";
import type { Report, ReportFilters } from "@/types";
import { reportsToGeoJSON } from "@/lib/map/geojson";
import { applyReportFilters } from "@/lib/map/filter-reports";
import { calculateSafetyScore } from "@/lib/map/safety-score";
import { mockStatistics } from "@/lib/mock-data";

const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

async function fetchLiveReports(): Promise<Report[]> {
  const res = await fetch("/api/reports");
  if (!res.ok) throw new Error("Failed to load reports");
  const data: { reports: Report[] } = await res.json();
  return data.reports;
}

export default function HomePage() {
  const [viewMode, setViewMode] = React.useState<MapViewMode>("heatmap");
  const [filters, setFilters] = React.useState<ReportFilters>({
    timeRange: "12m",
    dayNight: "all",
  });
  const [selectedPoint, setSelectedPoint] = React.useState<{
    name: string;
    lat: number;
    lng: number;
  }>({ name: "Dhaka (city-wide)", lat: DHAKA_CENTER.lat, lng: DHAKA_CENTER.lng });
  const [highlightedReportId, setHighlightedReportId] = React.useState<string | null>(null);
  const mapApiRef = React.useRef<{ flyTo: (lng: number, lat: number, zoom?: number) => void } | null>(
    null
  );

  // /api/reports serves both the generated demo dataset (seeded into
  // the same store on server startup, see lib/report-store.ts) and
  // any reports submitted through the real Phase 3 form — one source
  // of truth, no client-side merge needed.
  const { data: allReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchLiveReports,
  });

  const filteredReports = React.useMemo(
    () => applyReportFilters(allReports, filters),
    [allReports, filters]
  );

  const geoJsonData = React.useMemo(
    () => reportsToGeoJSON(filteredReports),
    [filteredReports]
  );

  const safetyScore = React.useMemo(
    () =>
      calculateSafetyScore(filteredReports, {
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
      }),
    [filteredReports, selectedPoint]
  );

  // Most recent reports, sorted, for the list below the map.
  const recentReportsSorted = React.useMemo(
    () =>
      [...filteredReports].sort(
        (a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime()
      ),
    [filteredReports]
  );

  function handleSelectLocation(result: GeocodeResult) {
    setSelectedPoint({ name: result.displayName.split(",")[0], lat: result.lat, lng: result.lng });
    mapApiRef.current?.flyTo(result.lng, result.lat, 15);
  }

  function handlePinClick(reportId: string) {
    setHighlightedReportId(reportId);
    const el = document.getElementById(`report-${reportId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Search — primary interface */}
      <SearchBar onSelectLocation={handleSelectLocation} />

      {/* Map — always the focal point, visible without scrolling */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <p className="text-xs text-muted-foreground">
            {filteredReports.length} report{filteredReports.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <MapContainer
          data={geoJsonData}
          viewMode={viewMode}
          onPinClick={handlePinClick}
          onReady={(api) => {
            mapApiRef.current = api;
          }}
          className="min-h-[360px] sm:min-h-[440px]"
        />
        <p className="sr-only">
          The map above shows report locations visually. Every report is also
          listed as text in the &ldquo;Recent Reports&rdquo; section below,
          which is fully keyboard and screen-reader accessible.
        </p>
      </div>

      {/* Safety Score for the currently searched/selected location */}
      <SafetyScoreCard locationName={selectedPoint.name} score={safetyScore} />

      {/* Dynamic filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Recent incidents */}
      <section aria-labelledby="recent-incidents-heading" className="flex flex-col gap-3">
        <h2 id="recent-incidents-heading" className="text-lg font-semibold text-foreground">
          Recent Reports
        </h2>
        {reportsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : recentReportsSorted.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentReportsSorted.slice(0, 9).map((report) => (
              <div
                key={report.id}
                id={`report-${report.id}`}
                className={
                  highlightedReportId === report.id
                    ? "rounded-card ring-2 ring-accent transition-shadow"
                    : undefined
                }
              >
                <IncidentCard report={report} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={AlertTriangle}
            title="No reports match these filters"
            description="Try widening the time range or clearing category filters."
          />
        )}
      </section>

      {/* Analytics */}
      <section aria-labelledby="analytics-heading" className="flex flex-col gap-3 pb-6">
        <h2 id="analytics-heading" className="text-lg font-semibold text-foreground">
          Dhaka at a Glance
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={AlertTriangle}
            label="Incidents Today"
            value={mockStatistics.incidentsToday}
          />
          <StatCard
            icon={TrendingUp}
            label="Most Reported Area"
            value={mockStatistics.mostDangerousAreas[0]?.name ?? "—"}
            hint={`Score ${mockStatistics.mostDangerousAreas[0]?.score ?? "—"}`}
          />
          <StatCard icon={Sun} label="Day Reports" value={mockStatistics.dayVsNight.day} />
          <StatCard icon={Moon} label="Night Reports" value={mockStatistics.dayVsNight.night} />
        </div>
      </section>
    </div>
  );
}
