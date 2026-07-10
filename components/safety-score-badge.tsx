import { Badge } from "@/components/ui/badge";
import { SAFETY_LEVEL_LABELS, type SafetyLevel } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_TO_VARIANT: Record<
  SafetyLevel,
  "safe" | "mostlySafe" | "caution" | "unsafe" | "avoid"
> = {
  safe: "safe",
  mostly_safe: "mostlySafe",
  caution: "caution",
  unsafe: "unsafe",
  avoid: "avoid",
};

export function SafetyLevelBadge({
  level,
  className,
}: {
  level: SafetyLevel;
  className?: string;
}) {
  return (
    <Badge variant={LEVEL_TO_VARIANT[level]} className={cn("font-semibold", className)}>
      {SAFETY_LEVEL_LABELS[level]}
    </Badge>
  );
}
