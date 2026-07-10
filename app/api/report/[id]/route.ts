import { NextRequest, NextResponse } from "next/server";
import { getReportById, toPublicReport } from "@/lib/report-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report || report.status !== "published") {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ report: toPublicReport(report) });
}
