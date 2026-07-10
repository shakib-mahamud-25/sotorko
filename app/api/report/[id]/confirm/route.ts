import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { addConfirmation, getReportById, toPublicReport } from "@/lib/report-store";
import { checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  confirmationType: z.enum(["experienced_similar", "still_unsafe", "conditions_improved"]),
  // Client-generated, localStorage-persisted anonymous browser id —
  // see lib/browser-id.ts. Not a real device fingerprint; only
  // strong enough to dedupe repeat clicks, per PRD/Architecture's own
  // "privacy-conscious" framing of this signal.
  browserId: z.string().min(1).max(200),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`confirm:${ipKey}`, {
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many confirmations. Please slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid confirmation." }, { status: 400 });
  }

  const report = await getReportById(id);
  if (!report || report.status !== "published") {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  // Hash the client-supplied browser id server-side before using it
  // as a dedup key, so the raw id (already low-sensitivity, but no
  // reason not to) isn't what's compared/stored.
  const browserHash = createHash("sha256").update(parsed.data.browserId).digest("hex");

  const updated = await addConfirmation(id, parsed.data.confirmationType, browserHash);

  if (!updated) {
    // Either already confirmed by this browser, or the report
    // vanished between the lookup above and here — either way, the
    // current state is a legitimate response, not a hard error.
    const current = await getReportById(id);
    return NextResponse.json({
      report: current ? toPublicReport(current) : null,
      alreadyConfirmed: true,
    });
  }

  return NextResponse.json({ report: toPublicReport(updated), alreadyConfirmed: false });
}
