"use client";
import { useMemo, useState } from "react";
import { Plus, Search, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { useTags } from "@/hooks/useTags";

type Range = "week" | "month" | "quarter" | "all";

function getRangeBounds(range: Range): { dueAfter?: Date; dueBefore?: Date } {
  if (range === "all") return {};
  const now = new Date();
  const dueAfter = new Date(now);
  dueAfter.setHours(0, 0, 0, 0);
  const dueBefore = new Date(now);
  if (range === "week") {
    // end of the current week (Sunday)
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 6 : 7 - day;
    dueBefore.setDate(now.getDate() + daysUntilSunday);
  } else if (range === "month") {
    dueBefore.setMonth(now.getMonth() + 1);
  } else {
    // quarter = 3 months
    dueBefore.setMonth(now.getMonth() + 3);
  }
  dueBefore.setHours(23, 59, 59, 999);
  return { dueAfter, dueBefore };
}

const RANGE_LABELS: Record<Range, string> = {
  week: "This week",
  month: "This month",
  quarter: "Next 3 months",
  all: "All upcoming",
};

export default function UpcomingPage() {
  const [range, setRange] = useState<Range>("week");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { dueAfter, dueBefore } = useMemo(() => getRangeBounds(range), [range]);

  const { tasks, loading, createTask, updateTask } = useTasks({
    status: ["TODO", "IN_PROGRESS"],
    search: search || undefined,
    dueAfter,
    dueBefore,
  });

  const { areas } = useAreas();
  const { tags } = useTags();

  const handleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, { status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Upcoming</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tasks with deadlines in {RANGE_LABELS[range].toLowerCase()}.</p>
        </div>
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
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search tasks…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="w-44">
            <CalendarDays className="h-4 w-4 text-slate-400 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="quarter">Next 3 months</SelectItem>
            <SelectItem value="all">All upcoming</SelectItem>
          </SelectContent>
        </Select>
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
          <p className="text-slate-500 text-sm">
            {range === "week"
              ? "Nothing due this week."
              : `No tasks due in ${RANGE_LABELS[range].toLowerCase()}.`}
          </p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
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
