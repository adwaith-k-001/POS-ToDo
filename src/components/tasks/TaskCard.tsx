"use client";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Circle, Clock, Tag, Layers, RepeatIcon,
  ChevronRight, AlertCircle,
} from "lucide-react";
import { cn, formatDate, isOverdue, PRIORITY_COLORS } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: TaskWithRelations;
  onComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  compact?: boolean;
}

export function TaskCard({ task, onComplete, compact = false }: TaskCardProps) {
  const router = useRouter();
  const isDone = task.status === "COMPLETED";
  const overdue = isOverdue(task.deadline) && !isDone;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(task.id);
  };

  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 cursor-pointer transition-colors hover:border-slate-700 hover:bg-slate-800/60",
        isDone && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        className="mt-0.5 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium text-slate-100 truncate",
              isDone && "line-through text-slate-500"
            )}
          >
            {task.icon && <span className="mr-1">{task.icon}</span>}
            {task.title}
          </span>

          {/* Priority dot */}
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
            "bg-red-500": task.priority === "URGENT",
            "bg-orange-500": task.priority === "HIGH",
            "bg-yellow-500": task.priority === "MEDIUM",
            "bg-slate-600": task.priority === "LOW",
          })} />
        </div>

        {!compact && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* Deadline */}
            {task.deadline && (
              <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-400" : "text-slate-500")}>
                {overdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {formatDate(task.deadline)}
              </span>
            )}

            {/* Area */}
            {task.area && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Layers className="h-3 w-3" />
                <span style={{ color: task.area.color }}>{task.area.name}</span>
              </span>
            )}

            {/* Tags */}
            {task.tags.slice(0, 2).map((tt) => (
              <Badge key={tt.tagId} className="text-[10px] px-1.5 py-0" style={{ color: tt.tag.color, borderColor: `${tt.tag.color}40` }}>
                {tt.tag.name}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-slate-600">+{task.tags.length - 2}</span>
            )}

            {/* Subtask count */}
            {(task._count?.subTasks ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <ChevronRight className="h-3 w-3" />
                {task._count!.subTasks} subtasks
              </span>
            )}

            {/* Recurring */}
            {task.repeatEnabled && (
              <span className="text-xs text-indigo-400 flex items-center gap-1">
                <RepeatIcon className="h-3 w-3" />
                {task.repeatPattern?.toLowerCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-slate-700 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
