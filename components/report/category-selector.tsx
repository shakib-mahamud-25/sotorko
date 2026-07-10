"use client";

import { INCIDENT_CATEGORY_LABELS, type IncidentCategory } from "@/types";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = Object.keys(INCIDENT_CATEGORY_LABELS) as IncidentCategory[];

interface CategorySelectorProps {
  value: IncidentCategory[];
  onChange: (categories: IncidentCategory[]) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  function toggle(category: IncidentCategory) {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  }

  return (
    <div role="group" aria-label="Incident categories" className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((category) => {
        const selected = value.includes(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(category)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-secondary"
            )}
          >
            {INCIDENT_CATEGORY_LABELS[category]}
          </button>
        );
      })}
    </div>
  );
}
