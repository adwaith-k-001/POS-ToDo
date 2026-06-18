import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-800 text-slate-300",
        outline: "border-slate-700 text-slate-400",
        success: "border-transparent bg-green-900/40 text-green-400",
        warning: "border-transparent bg-yellow-900/40 text-yellow-400",
        danger: "border-transparent bg-red-900/40 text-red-400",
        indigo: "border-transparent bg-indigo-900/40 text-indigo-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
