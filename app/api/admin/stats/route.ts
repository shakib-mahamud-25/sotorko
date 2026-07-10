import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { listAllReports, listPendingModerationEntries } from "@/lib/report-store";

export async function GET(request: NextRequest) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const all = await listAllReports();
  const pending = await listPendingModerationEntries();

  const statusCounts = {
    published: 0,
    pending_review: 0,
    archived: 0,
    removed: 0,
    merged: 0,
  };
  for (const r of all) {
    statusCounts[r.status] += 1;
  }

  return NextResponse.json(
    {
      totalReports: all.length,
      statusCounts,
      pendingModerationCount: pending.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
