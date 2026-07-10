"use client";

import { SEVERITY_LABELS, type Severity } from "@/types";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: Severity[] = ["low", "moderate", "high", "severe"];

const SEVERITY_STYLE: Record<Severity, string> = {
  low: "border-status-caution text-status-caution data-[selected=true]:bg-status-caution data-[selected=true]:text-white",
  moderate:
    "border-status-caution text-status-caution data-[selected=true]:bg-status-caution data-[selected=true]:text-white",
  high: "border-status-unsafe text-status-unsafe data-[selected=true]:bg-status-unsafe data-[selected=true]:text-white",
  severe:
    "border-status-avoid text-status-avoid data-[selected=true]:bg-status-avoid data-[selected=true]:text-white",
};

interface SeveritySelectorProps {
  value: Severity | null;
  onChange: (severity: Severity) => void;
}

export function SeveritySelector({ value, onChange }: SeveritySelectorProps) {
  return (
    <div role="radiogroup" aria-label="Severity" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SEVERITY_ORDER.map((severity) => (
        <button
          key={severity}
          type="button"
          role="radio"
          aria-checked={value === severity}
          data-selected={value === severity}
          onClick={() => onChange(severity)}
          className={cn(
            "rounded-button border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            SEVERITY_STYLE[severity]
          )}
        >
          {SEVERITY_LABELS[severity]}
        </button>
      ))}
    </div>
  );
}
