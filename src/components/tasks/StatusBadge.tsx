import { cn, STATUS_COLORS } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("text-xs font-medium", STATUS_COLORS[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
