import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Calendar, Clock, MapPin } from "lucide-react";
import { IncidentCard } from "@/components/incident-card";
import { ConfirmationPanel } from "@/components/confirmation-panel";
import type { Report } from "@/types";

/**
 * Fetches a report via the SAME API route the rest of the app uses,
 * rather than importing lib/report-store directly.
 *
 * This was originally a direct store import, which worked in
 * isolated testing but produced a real, reproducible bug: reports
 * visible via GET /api/report/[id] would 404 on this page, in both
 * `next dev` and a production `next build && next start`. Next.js's
 * App Router does not guarantee that Server Components and Route
 * Handlers share the same module instance of an in-memory singleton
 * — this in-memory store scaffold was never meant to survive that
 * assumption, and this is exactly the kind of bug a real database
 * doesn't have (a query is a query, regardless of which part of
 * Next.js issued it). Routing through the API here means this page
 * and every other consumer see identical data by construction, and
 * this fetch call is also the thing to delete once a real Supabase
 * client replaces both the store and this indirection.
 */
async function fetchReport(id: string): Promise<Report | null> {
  const headersList = await headers();
  const host = headersList.get("host");
  // x-forwarded-proto is set by Vercel and virtually every reverse
  // proxy in front of Node. Falling back to NODE_ENV-based guessing
  // (as an earlier version of this function did) broke local
  // production testing over plain HTTP, since NODE_ENV=production
  // does not imply the request arrived over HTTPS.
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/report/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data: { report: Report } = await res.json();
  return data.report;
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await fetchReport(id);

  if (!report) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Incident Details</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Approximate location shown — exact location is never public
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {new Date(report.incidentDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {report.incidentTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {report.incidentTime}
            </span>
          )}
        </p>
      </div>

      <IncidentCard report={report} />

      <ConfirmationPanel reportId={report.id} confirmationCounts={report.confirmationCounts} />
    </div>
  );
}
