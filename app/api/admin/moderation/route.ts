import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { listPendingModerationEntries, getReportById, toPublicReport } from "@/lib/report-store";
import type { ModerationQueueEntry, Report } from "@/types";

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entries = listPendingModerationEntries();

  const withReports: { entry: ModerationQueueEntry; report: Report | null }[] = entries.map(
    (entry) => {
      const stored = getReportById(entry.reportId);
      return { entry, report: stored ? toPublicReport(stored) : null };
    }
  );

  return NextResponse.json(
    { items: withReports },
    // Never cache moderator-facing data — this is auth-gated and
    // must always reflect the live queue state, not a stale copy any
    // intermediate cache/proxy might otherwise be tempted to serve.
    { headers: { "Cache-Control": "no-store" } }
  );
}
