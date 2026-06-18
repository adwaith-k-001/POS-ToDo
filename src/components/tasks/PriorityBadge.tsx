import { cn, PRIORITY_COLORS } from "@/lib/utils";
import type { Priority } from "@/types";

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span className={cn("text-xs font-medium", PRIORITY_COLORS[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
