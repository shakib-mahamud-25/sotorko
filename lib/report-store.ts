import { randomUUID } from "crypto";
import type { ConfirmationType, FlagReason, ModerationQueueEntry, ModeratorDecision, Report } from "@/types";
import { mockRecentReports } from "@/lib/mock-data";

/**
 * TEMPORARY in-memory store, alive only for the life of the server
 * process. This exists purely so Phases 3–5 have a working end-to-end
 * submit → moderate → confirm → view flow to build and test against
 * before a real Supabase project exists.
 *
 * Replace with real Supabase queries once the schema from
 * docs/02-Architecture.md §4 is migrated:
 *   - createReport   -> INSERT into reports (+ report_categories join rows)
 *   - getReportByEditCodeHash -> SELECT ... WHERE edit_code_hash = $1
 *   - updateReport / deleteReport -> scoped to the matching hash
 *   - addConfirmation -> INSERT into confirmations, keyed on
 *     (report_id, browser_fingerprint_hash, confirmation_type) with a
 *     unique constraint to enforce the one-confirmation-per-type-per-
 *     browser rule server-side instead of the in-memory Set below.
 *   - moderation queue -> INSERT/UPDATE into a moderation_queue table
 *     per Architecture §4 "Moderation Queue", instead of the Map below.
 *
 * The function signatures below are written to match what the real
 * Supabase-backed versions will look like, so swapping the
 * implementation shouldn't require changing any calling code in the
 * API routes.
 */

interface StoredReport extends Report {
  editCodeHash: string;
  /** Exact coordinates — NEVER serialize this back to a client response. */
  exactLatitude: number;
  exactLongitude: number;
}

const store = new Map<string, StoredReport>();
const moderationQueue = new Map<string, ModerationQueueEntry>();

// Tracks which (reportId, confirmationType) pairs a given hashed
// browser fingerprint has already confirmed, so the same browser
// can't inflate a report's confirmation count by resubmitting. Per
// Architecture §7 "Repeated reports from the same browser" as a
// negative trust signal — this is the confirmation-side analogue.
const confirmationDedup = new Set<string>();

// Tracks recent submission timestamps per caller key (hashed IP),
// feeding the trust-score assessment's "rapid submission pattern"
// signal (lib/trust-score.ts). Separate from the hard rate-limit
// bucket in lib/rate-limit.ts — this is a soft trust signal, not an
// enforcement gate.
const submissionTimestamps = new Map<string, number[]>();
const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;

function seedMockReports() {
  if (store.size > 0) return; // already seeded (e.g. hot reload)
  for (const report of mockRecentReports) {
    store.set(report.id, {
      ...report,
      editCodeHash: "", // seed data has no real edit code — cannot be edited/deleted via the API
      exactLatitude: report.latitude,
      exactLongitude: report.longitude,
    });
  }
}
seedMockReports();

export function insertReport(report: StoredReport): void {
  store.set(report.id, report);
}

export function getReportById(id: string): StoredReport | undefined {
  return store.get(id);
}

export function getReportByEditCodeHash(hash: string): StoredReport | undefined {
  if (!hash) return undefined;
  for (const report of store.values()) {
    // Seed/demo reports have an empty editCodeHash and must never
    // match — an empty submitted code is already rejected upstream,
    // but this guards the store layer independently too.
    if (report.editCodeHash && report.editCodeHash === hash) return report;
  }
  return undefined;
}

export function listPublishedReports(): StoredReport[] {
  return Array.from(store.values()).filter((r) => r.status === "published");
}

export function listAllReports(): StoredReport[] {
  return Array.from(store.values());
}

export function updateReport(id: string, patch: Partial<StoredReport>): StoredReport | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  store.set(id, updated);
  return updated;
}

export function deleteReport(id: string): boolean {
  return store.delete(id);
}

/**
 * Records a community confirmation on a report, per PRD §6
 * "Community Confirmation". Returns the updated report, or `null` if
 * this browser has already submitted this exact confirmation type
 * for this report (silently ignored — not an error — so the UI can
 * just show the confirmed state either way).
 */
export function addConfirmation(
  reportId: string,
  confirmationType: ConfirmationType,
  browserFingerprintHash: string
): StoredReport | null {
  const dedupKey = `${reportId}:${confirmationType}:${browserFingerprintHash}`;
  if (confirmationDedup.has(dedupKey)) {
    return null;
  }

  const existing = store.get(reportId);
  if (!existing) return null;

  confirmationDedup.add(dedupKey);

  const updated: StoredReport = {
    ...existing,
    confirmationCounts: {
      ...existing.confirmationCounts,
      [confirmationType]: existing.confirmationCounts[confirmationType] + 1,
    },
    updatedAt: new Date().toISOString(),
  };
  store.set(reportId, updated);
  return updated;
}

export function hasConfirmed(
  reportId: string,
  confirmationType: ConfirmationType,
  browserFingerprintHash: string
): boolean {
  return confirmationDedup.has(`${reportId}:${confirmationType}:${browserFingerprintHash}`);
}

/**
 * Records a submission timestamp for a caller and returns how many
 * submissions that caller has made within the trailing window,
 * INCLUDING this one. Feeds lib/trust-score.ts's velocity signal.
 */
export function recordSubmissionAndGetRecentCount(callerKey: string): number {
  const now = Date.now();
  const existing = submissionTimestamps.get(callerKey) ?? [];
  const recent = existing.filter((t) => now - t < SUBMISSION_WINDOW_MS);
  recent.push(now);
  submissionTimestamps.set(callerKey, recent);
  return recent.length;
}

/**
 * Adds a report to the moderation queue, per Architecture §4
 * "Moderation Queue" and §8 "If flagged". Called when trust
 * assessment at submission time determines a report shouldn't
 * publish immediately.
 */
export function enqueueForModeration(reportId: string, flagReasons: FlagReason[]): ModerationQueueEntry {
  const entry: ModerationQueueEntry = {
    queueId: randomUUID(),
    reportId,
    flagReasons,
    moderatorDecision: null,
    createdAt: new Date().toISOString(),
  };
  moderationQueue.set(entry.queueId, entry);
  return entry;
}

export function listPendingModerationEntries(): ModerationQueueEntry[] {
  return Array.from(moderationQueue.values())
    .filter((e) => e.moderatorDecision === null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getModerationEntry(queueId: string): ModerationQueueEntry | undefined {
  return moderationQueue.get(queueId);
}

/**
 * Applies a moderator's decision to a queue entry and the underlying
 * report, per Architecture §8: Approve -> publish, Archive -> remove
 * from public view but keep the record, Remove -> same as archive at
 * this schema stage (a real implementation would likely distinguish
 * these for appeals/audit purposes), Merge -> mark as merged (the
 * actual duplicate-merging logic is out of scope for this scaffold).
 */
export function decideModerationEntry(
  queueId: string,
  decision: ModeratorDecision,
  notes?: string
): { entry: ModerationQueueEntry; report: StoredReport } | undefined {
  const entry = moderationQueue.get(queueId);
  if (!entry) return undefined;

  const report = store.get(entry.reportId);
  if (!report) return undefined;

  const statusByDecision: Record<ModeratorDecision, Report["status"]> = {
    approve: "published",
    archive: "archived",
    remove: "removed",
    merge: "merged",
  };

  const updatedReport = updateReport(entry.reportId, { status: statusByDecision[decision] });
  if (!updatedReport) return undefined;

  const updatedEntry: ModerationQueueEntry = {
    ...entry,
    moderatorDecision: decision,
    notes,
    decidedAt: new Date().toISOString(),
  };
  moderationQueue.set(queueId, updatedEntry);

  return { entry: updatedEntry, report: updatedReport };
}

/** Strips server-only fields before a report is sent to a client. */
export function toPublicReport(stored: StoredReport): Report {
  const { editCodeHash: _editCodeHash, exactLatitude: _exactLatitude, exactLongitude: _exactLongitude, ...publicFields } = stored;
  void _editCodeHash;
  void _exactLatitude;
  void _exactLongitude;
  return publicFields;
}
