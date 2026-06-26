"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Target, CheckCircle2, Circle, ChevronRight,
  Clock, Layers, Tag as TagIcon, AlertCircle, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useFormData } from "@/hooks/useFormData";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { GoalWithTasks, TaskWithRelations } from "@/types";
import type { CreateTaskInput } from "@/lib/validations";

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<GoalWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const [subtaskFor, setSubtaskFor] = useState<TaskWithRelations | null>(null);
  const { areas, tags } = useFormData();

  const fetchGoal = useCallback(async () => {
    const res = await fetch(`/api/goals/${id}`);
    const json = await res.json();
    setGoal(json.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchGoal(); }, [fetchGoal]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, goalId: id }),
    });
    await fetchGoal();
    setTaskOpen(false);
  };

  const handleCreateSubtask = async (data: CreateTaskInput) => {
    if (!subtaskFor) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, parentTaskId: subtaskFor.id, goalId: id }),
    });
    await fetchGoal();
    setSubtaskFor(null);
  };

  const handleToggleTask = async (task: TaskWithRelations) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" }),
    });
    await fetchGoal();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}?permanent=true`, { method: "DELETE" });
    await fetchGoal();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="h-28 rounded-xl bg-slate-800/50 animate-pulse" />
      </div>
    );
  }

  if (!goal) return <p className="text-slate-500">Goal not found.</p>;

  const activeTasks = goal.tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "ARCHIVED");
  const completedTasks = goal.tasks.filter((t) => t.status === "COMPLETED");
  const total = goal.tasks.filter((t) => t.status !== "ARCHIVED").length;
  const done = completedTasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="primary" size="sm" onClick={() => setTaskOpen(true)}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Goal header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${goal.color}20` }}>
            <Target className="h-6 w-6" style={{ color: goal.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-100">{goal.title}</h1>
            {goal.description && (
              <p className="mt-1 text-sm text-slate-400">{goal.description}</p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
              </div>
              <span className="text-sm text-slate-400 shrink-0">{progress}% · {done}/{total} done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active tasks */}
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-14 text-center">
          <p className="text-slate-500 text-sm">No tasks yet. Add your first task for this goal.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setTaskOpen(true)}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <GoalTaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onAddSubtask={() => setSubtaskFor(task)}
                  onDelete={handleDeleteTask}
                  onNavigate={() => router.push(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">Completed</p>
              <div className="space-y-2 opacity-60">
                {completedTasks.map((task) => (
                  <GoalTaskRow
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onAddSubtask={() => {}}
                    onDelete={handleDeleteTask}
                    onNavigate={() => router.push(`/tasks/${task.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create task dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add Task to Goal</DialogTitle></DialogHeader>
          <TaskForm areas={areas} tags={tags} onSubmit={handleCreateTask} onCancel={() => setTaskOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Create subtask dialog */}
      <Dialog open={!!subtaskFor} onOpenChange={(o) => !o && setSubtaskFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Subtask to &ldquo;{subtaskFor?.title}&rdquo;</DialogTitle>
          </DialogHeader>
          <TaskForm areas={areas} tags={tags} onSubmit={handleCreateSubtask} onCancel={() => setSubtaskFor(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalTaskRow({
  task,
  onToggle,
  onAddSubtask,
  onDelete,
  onNavigate,
}: {
  task: TaskWithRelations;
  onToggle: (t: TaskWithRelations) => void;
  onAddSubtask: () => void;
  onDelete: (id: string) => void;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const isDone = task.status === "COMPLETED";
  const overdue = isOverdue(task.deadline) && !isDone;
  const isSubtask = !!task.parentTaskId;

  return (
    <div className="group">
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 cursor-pointer transition-colors hover:border-slate-700 hover:bg-slate-800/60",
          isDone && "opacity-60"
        )}
        onClick={onNavigate}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          className="mt-0.5 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
        >
          {isDone ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium text-slate-100 truncate", isDone && "line-through text-slate-500")}>
              {task.title}
            </span>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", {
              "bg-red-500": task.priority === "URGENT",
              "bg-orange-500": task.priority === "HIGH",
              "bg-yellow-500": task.priority === "MEDIUM",
              "bg-slate-600": task.priority === "LOW",
            })} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {task.deadline && (
              <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-400" : "text-slate-500")}>
                {overdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {formatDate(task.deadline)}
              </span>
            )}
            {task.area && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Layers className="h-3 w-3" /><span style={{ color: task.area.color }}>{task.area.name}</span>
              </span>
            )}
            {task.tags.slice(0, 2).map((tt) => (
              <Badge key={tt.tagId} className="text-[10px] px-1.5 py-0" style={{ color: tt.tag.color, borderColor: `${tt.tag.color}40` }}>
                {tt.tag.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Only show "add subtask" if this is a top-level task (not already a subtask) */}
          {!isSubtask && !isDone && (
            <Button variant="ghost" size="icon-sm" title="Add subtask" onClick={onAddSubtask}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete task?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently remove &ldquo;{task.title}&rdquo;.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(task.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
      </div>

      {/* Subtasks inline */}
      {task.subTasks.length > 0 && (
        <div className="ml-8 mt-1 space-y-1">
          {task.subTasks.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/60 px-4 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors",
                sub.status === "COMPLETED" && "opacity-50"
              )}
              onClick={() => router.push(`/tasks/${sub.id}`)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(sub); }}
                className="shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {sub.status === "COMPLETED"
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <Circle className="h-4 w-4" />}
              </button>
              <span className={cn("text-sm text-slate-300 flex-1 truncate", sub.status === "COMPLETED" && "line-through text-slate-500")}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
