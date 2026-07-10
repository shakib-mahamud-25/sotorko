export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

// Rough bounding box around greater Dhaka to bias/limit results.
const DHAKA_VIEWBOX = "90.30,23.92,90.55,23.66"; // left,top,right,bottom

/**
 * Geocodes a free-text query to a location using OpenStreetMap's
 * Nominatim service. No API key required. Rate-limited to 1 req/sec
 * by Nominatim's usage policy — fine for interactive search, but do
 * not batch-call this.
 *
 * Swap for a paid provider (Google Places, Mapbox) later if search
 * volume outgrows Nominatim's fair-use policy — see Technical
 * Architecture §2 "Future support".
 */
export async function geocodeDhaka(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: `${query}, Dhaka, Bangladesh`,
    format: "jsonv2",
    limit: "5",
    viewbox: DHAKA_VIEWBOX,
    bounded: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      // Nominatim's usage policy asks for an identifying value here.
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    throw new Error("Search failed. Please try again.");
  }

  const results: { display_name: string; lat: string; lon: string }[] = await res.json();

  return results.map((r) => ({
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
