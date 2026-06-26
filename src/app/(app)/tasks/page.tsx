"use client";
import { useState, useMemo } from "react";
import { Plus, Search, CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useFormData } from "@/hooks/useFormData";
import { cn, formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

type View = "today" | "upcoming" | "all" | "completed";
type UpcomingRange = "week" | "month" | "quarter" | "all";

const RANGE_LABELS: Record<UpcomingRange, string> = {
  week: "This Week",
  month: "This Month",
  quarter: "3 Months",
  all: "All",
};

function getUpcomingBounds(range: UpcomingRange): { dueAfter: Date; dueBefore?: Date } {
  const now = new Date();
  const dueAfter = new Date(now);
  dueAfter.setDate(dueAfter.getDate() + 1);
  dueAfter.setHours(0, 0, 0, 0);

  if (range === "all") return { dueAfter };

  const dueBefore = new Date(now);
  if (range === "week") {
    const daysUntilSunday = now.getDay() === 0 ? 6 : 7 - now.getDay();
    dueBefore.setDate(now.getDate() + daysUntilSunday);
  } else if (range === "month") {
    dueBefore.setMonth(now.getMonth() + 1);
  } else {
    dueBefore.setMonth(now.getMonth() + 3);
  }
  dueBefore.setHours(23, 59, 59, 999);
  return { dueAfter, dueBefore };
}

const VIEWS: { key: View; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
];

export default function TasksPage() {
  const [view, setView] = useState<View>("today");
  const [upcomingRange, setUpcomingRange] = useState<UpcomingRange>("week");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const taskOptions = useMemo(() => {
    const base = { search: search || undefined };
    if (view === "today") {
      const dueBefore = new Date();
      dueBefore.setHours(23, 59, 59, 999);
      return { ...base, status: ["TODO", "IN_PROGRESS"] as string[], dueBefore };
    }
    if (view === "upcoming") {
      return { ...base, status: ["TODO", "IN_PROGRESS"] as string[], ...getUpcomingBounds(upcomingRange) };
    }
    if (view === "all") {
      return { ...base, status: ["TODO", "IN_PROGRESS"] as string[] };
    }
    return { ...base, status: ["COMPLETED"] as string[] };
  }, [view, upcomingRange, search]);

  const { tasks, loading, createTask, updateTask } = useTasks(taskOptions);
  const { areas, tags } = useFormData();

  const handleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, { status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" });
  };

  const handleReopen = async (e: React.MouseEvent, task: TaskWithRelations) => {
    e.stopPropagation();
    await updateTask(task.id, { status: "TODO" });
  };

  const emptyMessage = {
    today: "Nothing due today.",
    upcoming: "No upcoming tasks.",
    all: "No active tasks.",
    completed: search ? "No completed tasks match your search." : "No completed tasks yet.",
  }[view];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Tasks</h1>
        {view !== "completed" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <TaskForm
                areas={areas}
                tags={tags}
                onSubmit={async (data) => { await createTask(data); setDialogOpen(false); }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-1">
        {VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === key
                ? "bg-slate-800 text-slate-100"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upcoming range sub-buttons */}
      {view === "upcoming" && (
        <div className="flex gap-1">
          {(Object.keys(RANGE_LABELS) as UpcomingRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setUpcomingRange(r)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                upcomingRange === r
                  ? "bg-indigo-600/30 text-indigo-300"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search tasks…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
          {view !== "completed" && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Add task
            </Button>
          )}
        </div>
      ) : view === "completed" ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 cursor-pointer hover:border-slate-700 hover:bg-slate-800/60 transition-colors"
            >
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-400 line-through truncate">{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {task.completedAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3" /> Completed {formatDate(task.completedAt)}
                    </span>
                  )}
                  {task.area && (
                    <span className="text-xs" style={{ color: task.area.color }}>{task.area.name}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-slate-400 hover:text-slate-200"
                onClick={(e) => handleReopen(e, task)}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
