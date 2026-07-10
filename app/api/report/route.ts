import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { reportFormSchema } from "@/lib/validation/report";
import { applyPrivacyOffset, generateEditCode, hashEditCode } from "@/lib/report-privacy";
import { insertReport, toPublicReport, recordSubmissionAndGetRecentCount, enqueueForModeration } from "@/lib/report-store";
import { checkRateLimit } from "@/lib/rate-limit";
import { assessNewReport } from "@/lib/trust-score";
import type { ConfirmationType, Report } from "@/types";

const EMPTY_CONFIRMATIONS: Record<ConfirmationType, number> = {
  experienced_similar: 0,
  still_unsafe: 0,
  conditions_improved: 0,
};

function getClientKey(request: NextRequest): string {
  // Best-effort caller identifier for rate limiting only — not used
  // for anything privacy-sensitive, and never stored against the
  // report itself. Real deployments should read this from a trusted
  // proxy header (e.g. Vercel's x-forwarded-for) rather than trusting
  // client-supplied headers directly.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);

  // First line of defense against naive spam. The real trust-score
  // system (Architecture §7 / Technical Architecture §8) belongs
  // here too, once there's a database to check duplicate
  // descriptions/locations against.
  const rateLimit = checkRateLimit(`report:${clientKey}`, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 reports per hour per caller
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reports submitted. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Photos are handled as a separate step in this Phase 3 scaffold
  // (already-processed, EXIF-stripped Blob references would be
  // uploaded to Supabase Storage directly from the client using a
  // signed URL in the real implementation — see PROJECT_CONTEXT.md).
  const parseResult = reportFormSchema.omit({ photos: true }).safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid submission.", issues: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  // Honeypot: real users never populate this field. Silently accept
  // (return success) rather than reveal detection to a bot.
  if (parseResult.data.website) {
    return NextResponse.json({
      id: randomUUID(),
      editCode: generateEditCode(),
    });
  }

  const { latitude, longitude, categories, severity, incidentDate, incidentTime, description } =
    parseResult.data;

  const { displayLatitude, displayLongitude } = applyPrivacyOffset(latitude, longitude);

  const editCode = generateEditCode();
  const editCodeHash = hashEditCode(editCode);
  const id = randomUUID();
  const now = new Date().toISOString();

  // Trust assessment decides publish-immediately vs. pending_review,
  // per Architecture §7/§8. This is the piece that was a stub through
  // Phase 4 — every report published unconditionally regardless of
  // signal, meaning the moderation queue had structurally nothing to
  // moderate. See lib/trust-score.ts for what is and isn't assessed.
  const recentCount = recordSubmissionAndGetRecentCount(clientKey);
  const assessment = assessNewReport({
    recentSubmissionCountFromCaller: recentCount,
    severity,
  });

  const report: Report & { editCodeHash: string; exactLatitude: number; exactLongitude: number } = {
    id,
    latitude,
    longitude,
    displayLatitude,
    displayLongitude,
    categories,
    severity,
    description,
    incidentDate,
    incidentTime,
    status: assessment.shouldPublishImmediately ? "published" : "pending_review",
    trustScore: assessment.trustScore,
    confirmationCounts: EMPTY_CONFIRMATIONS,
    createdAt: now,
    updatedAt: now,
    editCodeHash,
    exactLatitude: latitude,
    exactLongitude: longitude,
  };

  insertReport(report);

  if (!assessment.shouldPublishImmediately) {
    enqueueForModeration(id, assessment.flagReasons);
  }

  const publicReport = toPublicReport(report);

  // Edit code is included ONLY in this one response, immediately
  // after creation — per PRD §9 "This code is displayed only once."
  // This holds true regardless of publish status: the submitter
  // still needs a way to edit/delete their report even while it's
  // pending review.
  return NextResponse.json({
    report: publicReport,
    editCode,
  });
}
