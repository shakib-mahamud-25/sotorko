import Link from "next/link";
import { Calendar, Clock, MapPin, Share2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  INCIDENT_CATEGORY_LABELS,
  SEVERITY_LABELS,
  type Report,
} from "@/types";
import { cn } from "@/lib/utils";

const SEVERITY_VARIANT: Record<Report["severity"], "caution" | "unsafe" | "avoid"> = {
  low: "caution",
  moderate: "caution",
  high: "unsafe",
  severe: "avoid",
};

export function IncidentCard({ report }: { report: Report }) {
  const totalConfirmations = Object.values(report.confirmationCounts ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <Link
          href={`/incident/${report.id}`}
          className="flex flex-col gap-3 rounded-[calc(var(--radius-card)-4px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {report.categories.map((cat) => (
              <Badge key={cat} variant="default">
                {INCIDENT_CATEGORY_LABELS[cat]}
              </Badge>
            ))}
            <Badge variant={SEVERITY_VARIANT[report.severity]}>
              {SEVERITY_LABELS[report.severity]}
            </Badge>
          </div>

          {report.description && (
            <p className="text-sm text-foreground/90 line-clamp-3">
              {report.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Approximate location
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {new Date(report.incidentDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {report.incidentTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {report.incidentTime}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {totalConfirmations} confirmation{totalConfirmations === 1 ? "" : "s"}
          </span>
          <Button variant="ghost" size="sm" className={cn("text-muted-foreground")}>
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
