import type { FlagReason, Severity } from "@/types";

/**
 * Computes an initial trust score and any flag reasons for a report
 * at submission time, per Architecture §7 "Report Trust Score" and
 * §8 "Moderation Workflow". This is the piece that was missing
 * through Phase 4 — every report published immediately regardless of
 * signal, because nothing ever computed a score low enough to route
 * to pending_review.
 *
 * This is intentionally a SIMPLIFIED version of the real signal set.
 * Missing from here, because they need a real database to check
 * against: duplicate description similarity across reports, VPN/proxy
 * detection, and cross-report browser-behavior patterns. Those need
 * either a text-similarity query or an external signal source that
 * doesn't exist in this in-memory scaffold. What's implemented here
 * — submission velocity from the same caller, and severity vs.
 * corroboration mismatch — are the two signals that don't require
 * anything beyond what's already in the request and the store.
 */

const TRUST_SCORE_PUBLISH_THRESHOLD = 0.5;

export interface TrustAssessment {
  trustScore: number;
  flagReasons: FlagReason[];
  shouldPublishImmediately: boolean;
}

export function assessNewReport(params: {
  recentSubmissionCountFromCaller: number; // submissions from this caller in the last hour, including this one
  severity: Severity;
}): TrustAssessment {
  const { recentSubmissionCountFromCaller, severity } = params;
  const flagReasons: FlagReason[] = [];
  let trustScore = 0.75; // baseline for a fresh, anonymous, unconfirmed report

  // Rapid submission pattern from the same caller is a negative
  // signal per Architecture §7 "Excessive submissions" — even though
  // the rate limiter already hard-blocks past 5/hour, 3-4 in quick
  // succession is suspicious without being over that hard cap.
  if (recentSubmissionCountFromCaller >= 3) {
    trustScore -= 0.3;
    flagReasons.push("rate_limit_pattern");
  }

  // A "severe" report with zero track record is exactly the kind of
  // high-consequence, low-corroboration case that should get a human
  // look before it's presented to other users as established fact —
  // this is a judgment call about risk asymmetry, not a signal from
  // the architecture doc's literal list, but it follows directly from
  // the doc's stated priority order (privacy > safety > simplicity).
  if (severity === "severe") {
    trustScore -= 0.15;
    flagReasons.push("no_confirmations_high_severity");
  }

  trustScore = Math.max(0, Math.min(1, trustScore));

  return {
    trustScore,
    flagReasons,
    shouldPublishImmediately:
      trustScore >= TRUST_SCORE_PUBLISH_THRESHOLD && flagReasons.length === 0,
  };
}
