import { NextResponse } from "next/server";
import { listPublishedReports, toPublicReport } from "@/lib/report-store";

/**
 * Public listing endpoint. Only ever returns display coordinates —
 * toPublicReport() strips exactLatitude/exactLongitude and the edit
 * code hash before serialization. This is the API-side enforcement
 * of the privacy boundary that lib/map/geojson.ts assumes on the
 * frontend.
 */
export async function GET() {
  const reports = (await listPublishedReports()).map(toPublicReport);

  return NextResponse.json(
    { reports },
    {
      headers: {
        // Short edge/CDN cache with background revalidation: a few
        // seconds of staleness on the public report list is an
        // acceptable trade-off (the underlying data doesn't change
        // faster than people can read a map), and this doesn't block
        // fresh data — stale-while-revalidate serves the cached copy
        // immediately while fetching an updated one in the
        // background. TanStack Query's own 30s staleTime (see
        // components/layout/providers.tsx) governs client refetch
        // behavior on top of this.
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
