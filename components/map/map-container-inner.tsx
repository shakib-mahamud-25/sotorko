"use client";

import * as React from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed, Loader2 } from "lucide-react";
import { useSotorkoMap, type MapViewMode } from "@/lib/map/use-sotorko-map";
import type { ReportFeatureCollection } from "@/lib/map/geojson";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapContainerProps {
  data: ReportFeatureCollection;
  viewMode: MapViewMode;
  onPinClick?: (reportId: string) => void;
  className?: string;
  /** Imperative handle so parent components (search bar) can pan the map. */
  onReady?: (api: { flyTo: (lng: number, lat: number, zoom?: number) => void }) => void;
}

export function MapContainerInner({
  data,
  viewMode,
  onPinClick,
  className,
  onReady,
}: MapContainerProps) {
  const { containerRef, isLoaded, flyTo, locateUser } = useSotorkoMap({
    data,
    viewMode,
    onPinClick,
  });
  const [isLocating, setIsLocating] = React.useState(false);
  const [locateError, setLocateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isLoaded) onReady?.({ flyTo });
  }, [isLoaded, flyTo, onReady]);

  const handleLocate = async () => {
    setLocateError(null);
    setIsLocating(true);
    try {
      await locateUser();
    } catch {
      setLocateError("Couldn't access your location. Check browser permissions.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-card border border-border",
        className
      )}
    >
      <div
        ref={containerRef}
        role="application"
        aria-label="Interactive safety map of Dhaka"
        className="h-full w-full"
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        {locateError && (
          <p className="max-w-52 rounded-button bg-card px-3 py-1.5 text-xs text-destructive shadow-sm">
            {locateError}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleLocate}
          disabled={isLocating}
          aria-label="Use my current location"
          title="Use my current location"
          className="bg-card shadow-sm"
        >
          {isLocating ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
