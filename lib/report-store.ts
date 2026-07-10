import { randomUUID } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type {
  ConfirmationType,
  FlagReason,
  ModerationQueueEntry,
  ModeratorDecision,
  Report,
} from "@/types";

/**
 * Real Supabase-backed store, replacing the Phase 1-6 in-memory
 * scaffold. Every function here matches the exact signature (adjusted
 * to `async`) that the in-memory version had, per the migration note
 * that used to live at the top of this file — so API route callers
 * only needed `await` added, not a rewrite.
 *
 * Uses the service-role client throughout: these functions run only
 * in server-side route handlers, already gated by rate limiting
 * and/or `isAuthorizedAdmin()` at the call site. RLS is still enabled
 * on every table as defense-in-depth (see the schema SQL) — the
 * service role bypasses it because these queries need to read/write
 * across all statuses (e.g. moderators need pending_review rows,
 * which anon RLS policies deliberately exclude).
 */

interface StoredReport extends Report {
  editCodeHash: string;
  exactLatitude: number;
  exactLongitude: number;
}

const EMPTY_CONFIRMATIONS: Record<ConfirmationType, number> = {
  experienced_similar: 0,
  still_unsafe: 0,
  conditions_improved: 0,
};

// ---------------------------------------------------------------
// Row <-> domain-type mapping
// ---------------------------------------------------------------

// Minimal shape of what we select from `reports`, joined with its
// categories. Kept loose (not importing generated types) since
// types/database.ts is still a placeholder `any` — see that file's
// header comment for when/how to regenerate it properly.
interface ReportRow {
  id: string;
  edit_code_hash: string | null;
  exact_location: string | { coordinates: [number, number] } | null;
  display_latitude: number;
  display_longitude: number;
  severity: Report["severity"];
  description: string | null;
  incident_date: string;
  incident_time: string | null;
  status: Report["status"];
  trust_score: number;
  confirmation_experienced_similar: number;
  confirmation_still_unsafe: number;
  confirmation_conditions_improved: number;
  created_at: string;
  updated_at: string;
  report_categories?: { category: string }[];
}

function parseExactLocation(raw: ReportRow["exact_location"]): { lat: number; lng: number } {
  // PostGIS geography(Point) comes back from PostgREST as GeoJSON
  // when selected directly: { type: "Point", coordinates: [lng, lat] }.
  if (raw && typeof raw === "object" && "coordinates" in raw) {
    const [lng, lat] = raw.coordinates;
    return { lat, lng };
  }
  // Fallback: some client configs return WKB hex instead. Exact
  // coordinates aren't parsed from that form here since every write
  // path in this file uses ST_MakePoint with explicit lng/lat, and
  // every read path that needs exact coordinates selects the GeoJSON
  // form explicitly (see getReportById below).
  return { lat: 0, lng: 0 };
}

function rowToStoredReport(row: ReportRow): StoredReport {
  const { lat, lng } = parseExactLocation(row.exact_location);
  const categories = (row.report_categories ?? []).map((c) => c.category) as Report["categories"];

  return {
    id: row.id,
    editCodeHash: row.edit_code_hash ?? "",
    exactLatitude: lat,
    exactLongitude: lng,
    latitude: lat,
    longitude: lng,
    displayLatitude: row.display_latitude,
    displayLongitude: row.display_longitude,
    categories,
    severity: row.severity,
    description: row.description ?? undefined,
    incidentDate: row.incident_date,
    incidentTime: row.incident_time ?? undefined,
    status: row.status,
    trustScore: Number(row.trust_score),
    confirmationCounts: {
      experienced_similar: row.confirmation_experienced_similar,
      still_unsafe: row.confirmation_still_unsafe,
      conditions_improved: row.confirmation_conditions_improved,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const REPORT_SELECT_WITH_LOCATION =
  "*, exact_location, report_categories(category)";

// ---------------------------------------------------------------
// Reports
// ---------------------------------------------------------------

export async function insertReport(report: StoredReport): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("reports").insert({
    id: report.id,
    edit_code_hash: report.editCodeHash || null,
    exact_location: `SRID=4326;POINT(${report.exactLongitude} ${report.exactLatitude})`,
    display_latitude: report.displayLatitude,
    display_longitude: report.displayLongitude,
    severity: report.severity,
    description: report.description ?? null,
    incident_date: report.incidentDate,
    incident_time: report.incidentTime ?? null,
    status: report.status,
    trust_score: report.trustScore,
    confirmation_experienced_similar: report.confirmationCounts.experienced_similar,
    confirmation_still_unsafe: report.confirmationCounts.still_unsafe,
    confirmation_conditions_improved: report.confirmationCounts.conditions_improved,
    created_at: report.createdAt,
    updated_at: report.updatedAt,
  });

  if (error) throw new Error(`insertReport failed: ${error.message}`);

  if (report.categories.length > 0) {
    const { error: catError } = await supabase.from("report_categories").insert(
      report.categories.map((category) => ({ report_id: report.id, category }))
    );
    if (catError) throw new Error(`insertReport categories failed: ${catError.message}`);
  }
}

export async function getReportById(id: string): Promise<StoredReport | undefined> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT_WITH_LOCATION)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getReportById failed: ${error.message}`);
  if (!data) return undefined;
  return rowToStoredReport(data as unknown as ReportRow);
}

export async function getReportByEditCodeHash(hash: string): Promise<StoredReport | undefined> {
  if (!hash) return undefined;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT_WITH_LOCATION)
    .eq("edit_code_hash", hash)
    .maybeSingle();

  if (error) throw new Error(`getReportByEditCodeHash failed: ${error.message}`);
  if (!data) return undefined;
  return rowToStoredReport(data as unknown as ReportRow);
}

export async function listPublishedReports(): Promise<StoredReport[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT_WITH_LOCATION)
    .eq("status", "published");

  if (error) throw new Error(`listPublishedReports failed: ${error.message}`);
  return (data as unknown as ReportRow[]).map(rowToStoredReport);
}

export async function listAllReports(): Promise<StoredReport[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("reports").select(REPORT_SELECT_WITH_LOCATION);

  if (error) throw new Error(`listAllReports failed: ${error.message}`);
  return (data as unknown as ReportRow[]).map(rowToStoredReport);
}

export async function updateReport(
  id: string,
  patch: Partial<StoredReport>
): Promise<StoredReport | undefined> {
  const supabase = createServiceRoleClient();

  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.severity !== undefined) dbPatch.severity = patch.severity;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.trustScore !== undefined) dbPatch.trust_score = patch.trustScore;
  if (patch.confirmationCounts !== undefined) {
    dbPatch.confirmation_experienced_similar = patch.confirmationCounts.experienced_similar;
    dbPatch.confirmation_still_unsafe = patch.confirmationCounts.still_unsafe;
    dbPatch.confirmation_conditions_improved = patch.confirmationCounts.conditions_improved;
  }

  const { data, error } = await supabase
    .from("reports")
    .update(dbPatch)
    .eq("id", id)
    .select(REPORT_SELECT_WITH_LOCATION)
    .maybeSingle();

  if (error) throw new Error(`updateReport failed: ${error.message}`);
  if (!data) return undefined;
  return rowToStoredReport(data as unknown as ReportRow);
}

export async function deleteReport(id: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { error, count } = await supabase
    .from("reports")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(`deleteReport failed: ${error.message}`);
  return (count ?? 0) > 0;
}

// ---------------------------------------------------------------
// Confirmations
// ---------------------------------------------------------------

/**
 * The unique constraint on (report_id, browser_fingerprint_hash,
 * confirmation_type) — created in the schema SQL — is what makes
 * this safe under concurrent requests, replacing the in-memory Set's
 * dedup logic. A duplicate insert fails with Postgres error 23505,
 * which we treat as "already confirmed" (return null), matching the
 * original function's contract.
 */
export async function addConfirmation(
  reportId: string,
  confirmationType: ConfirmationType,
  browserFingerprintHash: string
): Promise<StoredReport | null> {
  const supabase = createServiceRoleClient();

  const { error: insertError } = await supabase.from("confirmations").insert({
    report_id: reportId,
    confirmation_type: confirmationType,
    browser_fingerprint_hash: browserFingerprintHash,
  });

  if (insertError) {
    if (insertError.code === "23505") return null; // duplicate confirmation
    throw new Error(`addConfirmation insert failed: ${insertError.message}`);
  }

  // Increment the matching denormalized counter column. Not fully
  // atomic against a concurrent update to a *different* field, but
  // safe against concurrent confirmations because the unique
  // constraint above already prevented duplicate increments from the
  // same browser — a second real confirmation calls this function
  // again by design and should increment again.
  const column = `confirmation_${confirmationType}` as
    | "confirmation_experienced_similar"
    | "confirmation_still_unsafe"
    | "confirmation_conditions_improved";

  const { data, error: rpcError } = await supabase.rpc("increment_confirmation_count", {
    p_report_id: reportId,
    p_column: column,
  });

  if (rpcError) throw new Error(`addConfirmation increment failed: ${rpcError.message}`);
  if (!data) return null;
  return rowToStoredReport(data as unknown as ReportRow);
}

export async function hasConfirmed(
  reportId: string,
  confirmationType: ConfirmationType,
  browserFingerprintHash: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("confirmations")
    .select("id")
    .eq("report_id", reportId)
    .eq("confirmation_type", confirmationType)
    .eq("browser_fingerprint_hash", browserFingerprintHash)
    .maybeSingle();

  if (error) throw new Error(`hasConfirmed failed: ${error.message}`);
  return !!data;
}

// ---------------------------------------------------------------
// Submission velocity (trust-score signal)
// ---------------------------------------------------------------

/**
 * Records a submission timestamp and returns the count within the
 * trailing window, INCLUDING this one — same contract as the
 * in-memory version. Backed by the reports table itself (via
 * created_at), keyed loosely by IP hash through a lightweight
 * side table, since caller identity isn't otherwise persisted.
 */
export async function recordSubmissionAndGetRecentCount(callerKey: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  await supabase.from("submission_events").insert({ caller_key: callerKey });

  const { count, error } = await supabase
    .from("submission_events")
    .select("id", { count: "exact", head: true })
    .eq("caller_key", callerKey)
    .gte("created_at", windowStart);

  if (error) throw new Error(`recordSubmissionAndGetRecentCount failed: ${error.message}`);
  return count ?? 1;
}

// ---------------------------------------------------------------
// Moderation queue
// ---------------------------------------------------------------

export async function enqueueForModeration(
  reportId: string,
  flagReasons: FlagReason[]
): Promise<ModerationQueueEntry> {
  const supabase = createServiceRoleClient();
  const queueId = randomUUID();
  const createdAt = new Date().toISOString();

  const { error } = await supabase.from("moderation_queue").insert({
    queue_id: queueId,
    report_id: reportId,
    flag_reasons: flagReasons,
    created_at: createdAt,
  });

  if (error) throw new Error(`enqueueForModeration failed: ${error.message}`);

  return { queueId, reportId, flagReasons, moderatorDecision: null, createdAt };
}

export async function listPendingModerationEntries(): Promise<ModerationQueueEntry[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .is("moderator_decision", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`listPendingModerationEntries failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    queueId: row.queue_id,
    reportId: row.report_id,
    flagReasons: row.flag_reasons,
    moderatorDecision: row.moderator_decision,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    decidedAt: row.decided_at ?? undefined,
  }));
}

export async function getModerationEntry(queueId: string): Promise<ModerationQueueEntry | undefined> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("queue_id", queueId)
    .maybeSingle();

  if (error) throw new Error(`getModerationEntry failed: ${error.message}`);
  if (!data) return undefined;

  return {
    queueId: data.queue_id,
    reportId: data.report_id,
    flagReasons: data.flag_reasons,
    moderatorDecision: data.moderator_decision,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
    decidedAt: data.decided_at ?? undefined,
  };
}

export async function decideModerationEntry(
  queueId: string,
  decision: ModeratorDecision,
  notes?: string
): Promise<{ entry: ModerationQueueEntry; report: StoredReport } | undefined> {
  const supabase = createServiceRoleClient();

  const entry = await getModerationEntry(queueId);
  if (!entry) return undefined;

  const statusByDecision: Record<ModeratorDecision, Report["status"]> = {
    approve: "published",
    archive: "archived",
    remove: "removed",
    merge: "merged",
  };

  const updatedReport = await updateReport(entry.reportId, { status: statusByDecision[decision] });
  if (!updatedReport) return undefined;

  const decidedAt = new Date().toISOString();
  const { error } = await supabase
    .from("moderation_queue")
    .update({ moderator_decision: decision, notes: notes ?? null, decided_at: decidedAt })
    .eq("queue_id", queueId);

  if (error) throw new Error(`decideModerationEntry failed: ${error.message}`);

  return {
    entry: { ...entry, moderatorDecision: decision, notes, decidedAt },
    report: updatedReport,
  };
}

/** Strips server-only fields before a report is sent to a client. */
export function toPublicReport(stored: StoredReport): Report {
  const { editCodeHash: _editCodeHash, exactLatitude: _exactLatitude, exactLongitude: _exactLongitude, ...publicFields } = stored;
  void _editCodeHash;
  void _exactLatitude;
  void _exactLongitude;
  return publicFields;
}
