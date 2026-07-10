"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Archive, Trash2, Merge, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/analytics/stat-card";
import { useAdminAuth } from "@/components/admin/admin-auth-context";
import {
  FLAG_REASON_LABELS,
  INCIDENT_CATEGORY_LABELS,
  SEVERITY_LABELS,
  type ModerationQueueEntry,
  type ModeratorDecision,
  type Report,
} from "@/types";

interface QueueItem {
  entry: ModerationQueueEntry;
  report: Report | null;
}

interface StatsResponse {
  totalReports: number;
  statusCounts: Record<string, number>;
  pendingModerationCount: number;
}

const DECISIONS: { decision: ModeratorDecision; label: string; icon: React.ComponentType<{ className?: string }>; variant: "primary" | "secondary" | "danger" }[] = [
  { decision: "approve", label: "Approve", icon: Check, variant: "primary" },
  { decision: "archive", label: "Archive", icon: Archive, variant: "secondary" },
  { decision: "remove", label: "Remove", icon: Trash2, variant: "danger" },
  { decision: "merge", label: "Merge (duplicate)", icon: Merge, variant: "secondary" },
];

export function ModerationDashboard() {
  const { secret } = useAdminAuth();
  const queryClient = useQueryClient();
  const [pendingDecisionId, setPendingDecisionId] = React.useState<string | null>(null);

  const authHeaders = React.useMemo(
    () => ({ Authorization: `Bearer ${secret}` }),
    [secret]
  );

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats", secret],
    queryFn: async (): Promise<StatsResponse> => {
      const res = await fetch("/api/admin/stats", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ["admin", "moderation", secret],
    queryFn: async (): Promise<QueueItem[]> => {
      const res = await fetch("/api/admin/moderation", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load moderation queue");
      const data = await res.json();
      return data.items;
    },
  });

  async function handleDecision(queueId: string, decision: ModeratorDecision) {
    setPendingDecisionId(queueId);
    try {
      const res = await fetch(`/api/admin/moderation/${queueId}`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error("Decision failed");

      toast.success(`Report ${decision === "approve" ? "approved" : decision + "d"}`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch {
      toast.error("Couldn't record that decision. Please try again.");
    } finally {
      setPendingDecisionId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Moderation Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports flagged by the trust-score assessment at submission time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard icon={ShieldQuestion} label="Pending Review" value={stats.pendingModerationCount} />
            <StatCard icon={Check} label="Published" value={stats.statusCounts.published ?? 0} />
            <StatCard icon={Archive} label="Archived" value={stats.statusCounts.archived ?? 0} />
            <StatCard icon={Trash2} label="Removed" value={stats.statusCounts.removed ?? 0} />
          </>
        )}
      </div>

      <section aria-labelledby="queue-heading" className="flex flex-col gap-3">
        <h2 id="queue-heading" className="text-lg font-semibold text-foreground">
          Queue
        </h2>

        {queueLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : !queue || queue.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Nothing pending"
            description="All caught up — no reports currently need review."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map(({ entry, report }) => (
              <Card key={entry.queueId}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {entry.flagReasons.map((reason) => (
                        <Badge key={reason} variant="caution">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          {FLAG_REASON_LABELS[reason]}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Trust score: {report ? (report.trustScore * 100).toFixed(0) : "—"}
                    </span>
                  </div>
                  {report && (
                    <>
                      <CardTitle className="text-base">
                        {report.categories.map((c) => INCIDENT_CATEGORY_LABELS[c]).join(", ")}
                        {" · "}
                        {SEVERITY_LABELS[report.severity]}
                      </CardTitle>
                      {report.description && (
                        <CardDescription className="line-clamp-2">
                          {report.description}
                        </CardDescription>
                      )}
                    </>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {DECISIONS.map(({ decision, label, icon: Icon, variant }) => (
                    <Button
                      key={decision}
                      size="sm"
                      variant={variant}
                      disabled={pendingDecisionId !== null}
                      onClick={() => handleDecision(entry.queueId, decision)}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
