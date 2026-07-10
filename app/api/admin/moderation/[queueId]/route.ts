import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { decideModerationEntry } from "@/lib/report-store";
import { toPublicReport } from "@/lib/report-store";

const decisionSchema = z.object({
  decision: z.enum(["approve", "archive", "remove", "merge"]),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  if (!isAuthorizedAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { queueId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
  }

  const result = decideModerationEntry(queueId, parsed.data.decision, parsed.data.notes);
  if (!result) {
    return NextResponse.json({ error: "Queue entry not found." }, { status: 404 });
  }

  return NextResponse.json({
    entry: result.entry,
    report: toPublicReport(result.report),
  });
}
