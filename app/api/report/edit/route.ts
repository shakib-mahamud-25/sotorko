import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashEditCode } from "@/lib/report-privacy";
import { getReportByEditCodeHash, updateReport, deleteReport, toPublicReport } from "@/lib/report-store";
import { editReportSchema } from "@/lib/validation/report";
import { checkRateLimit } from "@/lib/rate-limit";

const deleteSchema = z.object({
  code: z.string().min(1),
  action: z.literal("delete"),
});

const editRequestSchema = z.union([
  editReportSchema.extend({ action: z.literal("update").default("update") }),
  deleteSchema,
]);

/**
 * Handles both edit and delete using the anonymous edit code, per
 * PRD §9 "Anonymous Editing" — no account required, the code alone
 * proves ownership. Codes are never stored in plaintext; every
 * lookup here re-hashes the submitted code and compares hashes.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`edit:${request.headers.get("x-forwarded-for") ?? "unknown"}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = editRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const codeHash = hashEditCode(parsed.data.code);
  const existing = getReportByEditCodeHash(codeHash);

  // Deliberately vague error — do not reveal whether the code format
  // was wrong vs. no matching report exists, to avoid helping someone
  // enumerate valid codes.
  if (!existing) {
    return NextResponse.json({ error: "Code not recognized." }, { status: 404 });
  }

  if (parsed.data.action === "delete") {
    deleteReport(existing.id);
    return NextResponse.json({ deleted: true });
  }

  const updated = updateReport(existing.id, {
    ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    ...(parsed.data.severity !== undefined && { severity: parsed.data.severity }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Report could not be updated." }, { status: 500 });
  }

  return NextResponse.json({ report: toPublicReport(updated) });
}
