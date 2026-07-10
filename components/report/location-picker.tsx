"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
}

/**
 * See components/map/map-container.tsx for why this is dynamically
 * imported rather than a static import — same rationale (MapLibre is
 * large, reads `window` at import time, and this component isn't
 * needed until someone opens the report form).
 */
const LocationPickerInner = dynamic(
  () => import("./location-picker-inner").then((mod) => mod.LocationPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-card border border-border bg-secondary">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    ),
  }
);

export function LocationPicker(props: LocationPickerProps) {
  return <LocationPickerInner {...props} />;
}
