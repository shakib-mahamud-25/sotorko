"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import type { ReportFeatureCollection } from "@/lib/map/geojson";

const DHAKA_CENTER: [number, number] = [90.4125, 23.8103];
const DEFAULT_ZOOM = 11;

const REPORTS_SOURCE_ID = "reports";
const HEATMAP_LAYER_ID = "reports-heatmap";
const PINS_LAYER_ID = "reports-pins";
const PINS_UNCLUSTERED_LABEL_ID = "reports-pins-count";

// Clean, minimal light basemap style using OpenStreetMap raster tiles.
// Swappable for Google Maps / Mapbox later per Technical Architecture
// §2 "Future support" without touching layer logic below.
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
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
      paint: {
        // Desaturate slightly so the map stays "calm" per the design
        // philosophy — pins/heatmap should carry the visual weight,
        // not the basemap.
        "raster-saturation": -0.3,
        "raster-brightness-min": 0.15,
      },
    },
  ],
};

export type MapViewMode = "heatmap" | "pins";

interface UseSotorkoMapOptions {
  data: ReportFeatureCollection;
  viewMode: MapViewMode;
  onPinClick?: (reportId: string) => void;
}

export function useSotorkoMap({ data, viewMode, onPinClick }: UseSotorkoMapOptions) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const onPinClickRef = React.useRef(onPinClick);
  React.useEffect(() => {
    onPinClickRef.current = onPinClick;
  }, [onPinClick]);

  // Initialize map once.
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DHAKA_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource(REPORTS_SOURCE_ID, {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 40,
        clusterMaxZoom: 15,
      });

      // Heatmap layer
      map.addLayer({
        id: HEATMAP_LAYER_ID,
        type: "heatmap",
        source: REPORTS_SOURCE_ID,
        maxzoom: 17,
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(37, 99, 235, 0)",
            0.2, "rgba(34, 197, 94, 0.5)",
            0.4, "rgba(245, 158, 11, 0.6)",
            0.6, "rgba(234, 88, 12, 0.7)",
            0.8, "rgba(220, 38, 38, 0.8)",
            1, "rgba(153, 27, 27, 0.9)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 15, 30],
          "heatmap-opacity": 0.85,
        },
        layout: { visibility: "visible" },
      });

      // Clustered/unclustered pins layer (severity-colored)
      map.addLayer({
        id: PINS_LAYER_ID,
        type: "circle",
        source: REPORTS_SOURCE_ID,
        paint: {
          "circle-radius": [
            "case",
            ["has", "point_count"],
            ["step", ["get", "point_count"], 14, 5, 18, 15, 24],
            7,
          ],
          "circle-color": [
            "case",
            ["has", "point_count"],
            "#0F172A",
            [
              "match",
              ["get", "severity"],
              "severe", "#DC2626",
              "high", "#EA580C",
              "moderate", "#F59E0B",
              "low", "#22C55E",
              "#2563EB",
            ],
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
        layout: { visibility: "none" },
      });

      map.addLayer({
        id: PINS_UNCLUSTERED_LABEL_ID,
        type: "symbol",
        source: REPORTS_SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          visibility: "none",
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.on("click", PINS_LAYER_ID, (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const clusterId = feature.properties?.cluster_id;
        if (clusterId !== undefined) {
          const source = map.getSource(REPORTS_SOURCE_ID) as maplibregl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const geometry = feature.geometry;
            if (geometry.type === "Point") {
              map.easeTo({
                center: geometry.coordinates as [number, number],
                zoom: zoom ?? map.getZoom() + 2,
              });
            }
          });
          return;
        }

        const reportId = feature.properties?.id;
        if (reportId) onPinClickRef.current?.(reportId);
      });

      map.on("mouseenter", PINS_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", PINS_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      setIsLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the GeoJSON source in sync with filtered data.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const source = map.getSource(REPORTS_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(data);
  }, [data, isLoaded]);

  // Toggle heatmap vs pins visibility.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const heatmapVisible = viewMode === "heatmap";
    map.setLayoutProperty(
      HEATMAP_LAYER_ID,
      "visibility",
      heatmapVisible ? "visible" : "none"
    );
    map.setLayoutProperty(
      PINS_LAYER_ID,
      "visibility",
      heatmapVisible ? "none" : "visible"
    );
    map.setLayoutProperty(
      PINS_UNCLUSTERED_LABEL_ID,
      "visibility",
      heatmapVisible ? "none" : "visible"
    );
  }, [viewMode, isLoaded]);

  const flyTo = React.useCallback((lng: number, lat: number, zoom = 14) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 900 });
  }, []);

  const locateUser = React.useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          flyTo(longitude, latitude, 15);
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }, [flyTo]);

  return { containerRef, isLoaded, flyTo, locateUser };
}
