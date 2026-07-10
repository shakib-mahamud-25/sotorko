"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeDhaka, type GeocodeResult } from "@/lib/map/geocode";
import { cn } from "@/lib/utils";

const DHAKA_CENTER: [number, number] = [90.4125, 23.8103];

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      paint: { "raster-saturation": -0.3, "raster-brightness-min": 0.15 },
    },
  ],
};

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
}

export function LocationPickerInner({ value, onChange }: LocationPickerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);
  const onChangeRef = React.useRef(onChange);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locateError, setLocateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: value ? [value.lng, value.lat] : DHAKA_CENTER,
      zoom: value ? 15 : 11,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (e) => {
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    map.on("load", () => setIsLoaded(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker synced with value.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#DC2626", draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      markerRef.current.on("dragend", () => {
        const pos = markerRef.current!.getLngLat();
        onChangeRef.current({ lat: pos.lat, lng: pos.lng });
      });
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
    }
  }, [value, isLoaded]);

  async function handleUseMyLocation() {
    setLocateError(null);
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by this browser."));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      onChange(point);
      mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 16, duration: 800 });
    } catch {
      setLocateError("Couldn't access your location. Tap the map to place a pin instead.");
    } finally {
      setIsLocating(false);
    }
  }

  // Keyboard-operable alternative to clicking/dragging on the map
  // canvas, which has no keyboard equivalent by nature (a MapLibre
  // canvas isn't a focusable, key-navigable widget). Per Design
  // System §16 "Accessibility is a core requirement, not an
  // afterthought" — this text search is not a lesser fallback bolted
  // on for compliance, it's a fully equivalent way to set the same
  // `value` the map interactions produce, reusing the same geocoder
  // already used by the main search bar.
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setSearchError(null);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        setSearchResults(await geocodeDhaka(q));
      } catch {
        setSearchError("Search failed. Please try again.");
      } finally {
        setIsSearching(false);
      }
    }, 450);
  }

  function handleSearchSelect(result: GeocodeResult) {
    const point = { lat: result.lat, lng: result.lng };
    onChange(point);
    mapRef.current?.flyTo({ center: [point.lng, point.lat], zoom: 16, duration: 800 });
    setSearchQuery(result.displayName.split(",")[0]);
    setSearchResults([]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label htmlFor="location-search" className="sr-only">
          Search for a location by name (keyboard-accessible alternative to
          tapping the map)
        </label>
        <div className="flex items-center gap-2 rounded-input border border-input bg-background px-2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <Input
            id="location-search"
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Or type a location name…"
            aria-expanded={searchResults.length > 0}
            aria-autocomplete="list"
            role="combobox"
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        {searchError && <p className="mt-1 text-xs text-destructive">{searchError}</p>}
        {searchResults.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-card border border-border bg-card shadow-lg"
          >
            {searchResults.map((result, i) => (
              <li key={`${result.lat}-${result.lng}-${i}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSearchSelect(result)}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none",
                    i !== searchResults.length - 1 && "border-b border-border"
                  )}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="text-foreground">{result.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={cn(
          "relative h-64 w-full overflow-hidden rounded-card border border-border"
        )}
      >
        <div ref={containerRef} className="h-full w-full" aria-hidden="true" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="absolute bottom-3 right-3 bg-card shadow-sm"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          )}
          Use my location
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {value
          ? "Pin placed. Drag it to adjust, tap elsewhere on the map, or search above."
          : "Tap the map, use your current location, or search for a place by name."}
      </p>
      {locateError && (
        <p role="alert" className="text-xs text-destructive">
          {locateError}
        </p>
      )}
    </div>
  );
}
