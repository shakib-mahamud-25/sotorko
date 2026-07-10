import { Clock, TrendingDown, TrendingUp, Minus, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SafetyLevelBadge } from "@/components/safety-score-badge";
import type { SafetyScore } from "@/types";
import { cn } from "@/lib/utils";

const TREND_ICON = {
  improving: TrendingUp,
  worsening: TrendingDown,
  stable: Minus,
} as const;

const LEVEL_RING: Record<SafetyScore["level"], string> = {
  safe: "text-status-safe",
  mostly_safe: "text-status-mostly-safe",
  caution: "text-status-caution",
  unsafe: "text-status-unsafe",
  avoid: "text-status-avoid",
};

export function SafetyScoreCard({
  locationName,
  score,
}: {
  locationName: string;
  score: SafetyScore;
}) {
  const TrendIcon = TREND_ICON[score.trend];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <p className="text-sm text-muted-foreground">Safety Score for</p>
          <h3 className="text-lg font-semibold text-foreground">{locationName}</h3>
        </div>
        <SafetyLevelBadge level={score.level} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <span
            className={cn(
              "text-5xl font-bold tabular-nums leading-none",
              LEVEL_RING[score.level]
            )}
          >
            {score.score}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {score.recentIncidentCount} recent {score.recentIncidentCount === 1 ? "report" : "reports"}
          </span>
          <span className="flex items-center gap-1.5">
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            {score.trend === "stable" ? "Stable" : score.trend === "improving" ? "Improving" : "Worsening"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Updated {new Date(score.lastUpdated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
