"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, ChevronRight, CheckCircle2, Circle, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useGoals } from "@/hooks/useGoals";
import { cn, formatDate } from "@/lib/utils";
import type { GoalWithTasks } from "@/types";

const GOAL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9",
];

function GoalForm({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues?: Partial<{ title: string; description: string; color: string; targetDate: string }>;
  onSubmit: (data: { title: string; description?: string; color: string; targetDate?: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [color, setColor] = useState(defaultValues?.color ?? "#6366f1");
  const [targetDate, setTargetDate] = useState(defaultValues?.targetDate ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description || undefined,
        color,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="goal-title">Title *</Label>
        <Input
          id="goal-title"
          placeholder="e.g. Get my internship, Final year project…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goal-desc">Description</Label>
        <Textarea
          id="goal-desc"
          placeholder="What does achieving this goal look like?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform",
                color === c ? "border-white scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goal-target">Target date (optional)</Label>
        <Input
          id="goal-target"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="[color-scheme:dark]"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
          {loading ? "Saving…" : "Save Goal"}
        </Button>
      </div>
    </form>
  );
}

function GoalCard({ goal, onEdit, onDelete }: { goal: GoalWithTasks; onEdit: () => void; onDelete: () => void }) {
  const router = useRouter();
  const total = goal.tasks.filter((t) => t.status !== "ARCHIVED").length;
  const done = goal.tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="group relative rounded-xl border border-slate-800 bg-slate-900 p-5 cursor-pointer hover:border-slate-700 hover:bg-slate-800/60 transition-colors"
      onClick={() => router.push(`/goals/${goal.id}`)}
    >
      {/* Color strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: goal.color }} />

      <div className="flex items-start gap-4 pl-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${goal.color}20` }}>
          <Target className="h-5 w-5" style={{ color: goal.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 truncate">{goal.title}</h3>
            <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {goal.description && (
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{goal.description}</p>
          )}

          {/* Progress */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: goal.color }}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">
              {done}/{total} tasks
            </span>
          </div>

          {goal.targetDate && (
            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" /> Target: {formatDate(goal.targetDate)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{goal.title}&rdquo; will be deleted. Its tasks will move to your inbox.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function GoalsClient() {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalWithTasks | null>(null);

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Goals</h1>
          <p className="text-sm text-slate-500 mt-0.5">Long-term goals with tasks and subtasks.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Goal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
            <GoalForm
              onSubmit={async (data) => { await createGoal(data); setCreateOpen(false); }}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active goals */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <Target className="h-8 w-8 text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">No active goals yet.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add your first goal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditGoal(goal)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-3">Completed</p>
          <div className="space-y-3 opacity-60">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setEditGoal(goal)}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
          {editGoal && (
            <GoalForm
              defaultValues={{
                title: editGoal.title,
                description: editGoal.description ?? "",
                color: editGoal.color,
                targetDate: editGoal.targetDate ? new Date(editGoal.targetDate).toISOString().slice(0, 10) : "",
              }}
              onSubmit={async (data) => { await updateGoal(editGoal.id, data); setEditGoal(null); }}
              onCancel={() => setEditGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
