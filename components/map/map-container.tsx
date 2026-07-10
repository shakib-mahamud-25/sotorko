"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportFeatureCollection } from "@/lib/map/geojson";
import type { MapViewMode } from "@/lib/map/use-sotorko-map";

interface MapContainerProps {
  data: ReportFeatureCollection;
  viewMode: MapViewMode;
  onPinClick?: (reportId: string) => void;
  className?: string;
  onReady?: (api: { flyTo: (lng: number, lat: number, zoom?: number) => void }) => void;
}

/**
 * MapLibre GL is a large library (~1MB) that reads `window` at
 * import time, so it can't be server-rendered and shouldn't be part
 * of the initial JS payload for pages that don't immediately need
 * it. `next/dynamic` with `ssr: false` code-splits it into its own
 * chunk, fetched only once this component actually mounts — per
 * Technical Architecture §12 "Lazy-loaded components" and "Code
 * splitting" as explicit performance requirements.
 *
 * This is the ONLY file that should import map-container-inner.tsx
 * directly; every consumer (homepage, etc.) should import this
 * wrapper instead.
 */
const MapContainerInner = dynamic(
  () => import("./map-container-inner").then((mod) => mod.MapContainerInner),
  {
    ssr: false,
    loading: () => <MapLoadingFallback />,
  }
);

function MapLoadingFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] w-full items-center justify-center rounded-card border border-border bg-secondary",
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

export function MapContainer(props: MapContainerProps) {
  return <MapContainerInner {...props} />;
}
