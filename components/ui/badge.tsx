import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-accent/10 text-accent",
        outline: "border-border text-foreground",

        /* Safety score status badges — colors from Design System §3 */
        safe: "border-transparent bg-status-safe/10 text-status-safe",
        mostlySafe: "border-transparent bg-status-mostly-safe/10 text-status-mostly-safe",
        caution: "border-transparent bg-status-caution/10 text-status-caution",
        unsafe: "border-transparent bg-status-unsafe/10 text-status-unsafe",
        avoid: "border-transparent bg-status-avoid/10 text-status-avoid",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
