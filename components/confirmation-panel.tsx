"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, HeartHandshake, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getBrowserId } from "@/lib/browser-id";
import type { ConfirmationType, Report } from "@/types";
import { cn } from "@/lib/utils";

const CONFIRMATION_OPTIONS: {
  type: ConfirmationType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: "experienced_similar",
    label: "I experienced something similar",
    icon: HeartHandshake,
  },
  {
    type: "still_unsafe",
    label: "I still feel unsafe here",
    icon: ShieldAlert,
  },
  {
    type: "conditions_improved",
    label: "Conditions have improved",
    icon: Sparkles,
  },
];

export function ConfirmationPanel({
  reportId,
  confirmationCounts,
}: {
  reportId: string;
  confirmationCounts: Report["confirmationCounts"];
}) {
  const queryClient = useQueryClient();
  const [counts, setCounts] = React.useState(confirmationCounts);
  const [confirmedTypes, setConfirmedTypes] = React.useState<Set<ConfirmationType>>(new Set());
  const [pendingType, setPendingType] = React.useState<ConfirmationType | null>(null);

  async function handleConfirm(type: ConfirmationType) {
    if (confirmedTypes.has(type) || pendingType) return;

    setPendingType(type);
    try {
      const res = await fetch(`/api/report/${reportId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationType: type, browserId: getBrowserId() }),
      });

      if (!res.ok) {
        throw new Error("Couldn't submit that. Please try again.");
      }

      const data: { report: Report | null; alreadyConfirmed: boolean } = await res.json();

      setConfirmedTypes((prev) => new Set(prev).add(type));
      if (data.report) {
        setCounts(data.report.confirmationCounts);
      }

      if (data.alreadyConfirmed) {
        toast.info("You've already added this confirmation.");
      } else {
        toast.success("Thanks for helping keep this accurate.");
        queryClient.invalidateQueries({ queryKey: ["reports"] });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPendingType(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Does this match your experience?</CardTitle>
        <CardDescription>
          Help other women by confirming this report — no comments or account
          needed. You can add each type of confirmation once.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {CONFIRMATION_OPTIONS.map(({ type, label, icon: Icon }) => {
          const confirmed = confirmedTypes.has(type);
          const isPending = pendingType === type;
          const count = counts[type] ?? 0;

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleConfirm(type)}
              disabled={confirmed || pendingType !== null}
              className={cn(
                "flex items-center justify-between gap-3 rounded-button border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                confirmed
                  ? "border-accent/40 bg-accent/5 text-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary disabled:opacity-60"
              )}
            >
              <span className="flex items-center gap-2.5">
                {confirmed ? (
                  <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                {label}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {isPending ? "…" : `${count} ${count === 1 ? "person" : "people"}`}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
