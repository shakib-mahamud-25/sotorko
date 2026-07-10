"use client";

import { Flame, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "heatmap" | "pins";

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Map display mode"
      className="inline-flex items-center rounded-button border border-border bg-card p-1"
    >
      {(
        [
          { mode: "heatmap" as const, label: "Heatmap", icon: Flame },
          { mode: "pins" as const, label: "Pins", icon: MapPin },
        ]
      ).map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "flex items-center gap-1.5 rounded-[calc(var(--radius-button)-4px)] px-3 py-1.5 text-sm font-medium transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
