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
      style={{
        position: "relative", display: "flex", gap: "16px",
        padding: "20px 20px 20px 22px", borderRadius: "16px", cursor: "pointer",
        background: "var(--glass)", border: "1px solid rgba(215,172,97,0.16)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)", transition: "transform .2s, border-color .2s",
      }}
      onClick={() => router.push(`/goals/${goal.id}`)}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(215,172,97,0.16)";
      }}
    >
      {/* Color strip */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", borderRadius: "16px 0 0 16px", background: goal.color }} />

      {/* Icon */}
      <div style={{
        width: "42px", height: "42px", flexShrink: 0, borderRadius: "12px",
        background: `${goal.color}20`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Target style={{ width: "20px", height: "20px", color: goal.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "18px", fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.title}</span>
          {goal.targetDate && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--t3)", whiteSpace: "nowrap", flexShrink: 0 }}>
              {formatDate(goal.targetDate)}
            </span>
          )}
        </div>
        {goal.description && (
          <p style={{ fontSize: "12.5px", color: "var(--t3)", marginTop: "5px", lineHeight: 1.5 }}>{goal.description}</p>
        )}
        <div style={{ marginTop: "14px", height: "6px", borderRadius: "4px", background: "rgba(215,172,97,0.12)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "4px", background: goal.color, width: `${progress}%`, transition: "width .4s" }} />
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--t3)", marginTop: "8px" }}>
          {done}/{total} tasks · {progress}%
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          style={{ background: "transparent", border: "none", padding: "6px", borderRadius: "8px", color: "var(--t3)", cursor: "pointer" }}
        >
          <Pencil style={{ width: "14px", height: "14px" }} />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button style={{ background: "transparent", border: "none", padding: "6px", borderRadius: "8px", color: "#D9544E", cursor: "pointer", opacity: 0.7 }}>
              <Trash2 style={{ width: "14px", height: "14px" }} />
            </button>
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
  );
}

export function GoalsClient() {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalWithTasks | null>(null);

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>Goals</h1>
          <p style={{ fontSize: "13.5px", color: "var(--t3)", marginTop: "4px" }}>Long-term goals with tasks and subtasks.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <button style={{
              background: "var(--accent)", color: "var(--ink)", border: "none",
              padding: "10px 18px", borderRadius: "10px", fontSize: "13.5px",
              fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "0 5px 18px rgba(215,172,97,0.4)",
            }}>
              + New Goal
            </button>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "22px" }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: "110px", borderRadius: "16px", background: "var(--glass2)" }} />
          ))}
        </div>
      ) : activeGoals.length === 0 ? (
        <div style={{ border: "1px dashed rgba(215,172,97,0.3)", borderRadius: "14px", padding: "48px", textAlign: "center", background: "rgba(215,172,97,0.03)", marginTop: "22px" }}>
          <p style={{ fontSize: "13.5px", color: "var(--t2)" }}>No active goals yet.</p>
          <button
            onClick={() => setCreateOpen(true)}
            style={{ marginTop: "12px", background: "transparent", border: "1px solid rgba(215,172,97,0.24)", borderRadius: "8px", padding: "7px 14px", fontSize: "12.5px", color: "var(--t2)", cursor: "pointer" }}
          >
            + Add your first goal
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "22px" }}>
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
        <div style={{ marginTop: "24px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.16em", color: "var(--t3)", marginBottom: "14px" }}>COMPLETED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", opacity: 0.6 }}>
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
