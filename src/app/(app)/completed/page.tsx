"use client";
import { useState } from "react";
import { Search, CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTasks";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

export default function CompletedPage() {
  const [search, setSearch] = useState("");
  const { tasks, loading, updateTask } = useTasks({
    status: ["COMPLETED"],
    search: search || undefined,
  });
  const router = useRouter();

  const handleReopen = async (e: React.MouseEvent, task: TaskWithRelations) => {
    e.stopPropagation();
    await updateTask(task.id, { status: "TODO" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Completed</h1>
        <p className="text-sm text-slate-500 mt-0.5">All tasks you have marked as done. Click any to edit or reopen.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search completed tasks…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">
            {search ? "No completed tasks match your search." : "No completed tasks yet."}
          </p>
        </div>
      ) : (
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
                title="Reopen task"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reopen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
