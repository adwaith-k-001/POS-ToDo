"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Archive, RotateCcw, CheckCircle2, Circle,
  Clock, Layers, Tag, RepeatIcon, Plus, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatRelative, completionLatencyDays } from "@/lib/utils";
import { useFormData } from "@/hooks/useFormData";
import type { TaskWithRelations, TaskHistory } from "@/types";
import type { CreateTaskInput } from "@/lib/validations";

const HISTORY_LABELS: Record<string, string> = {
  CREATED: "Task created",
  UPDATED: "Task updated",
  COMPLETED: "Marked as completed",
  REOPENED: "Reopened",
  PRIORITY_CHANGED: "Priority changed",
  DEADLINE_CHANGED: "Deadline changed",
  ARCHIVED: "Archived",
  RESTORED: "Restored",
  AREA_CHANGED: "Area changed",
  TAG_ADDED: "Tag added",
  TAG_REMOVED: "Tag removed",
  STATUS_CHANGED: "Status changed",
  TITLE_CHANGED: "Title changed",
  DESCRIPTION_CHANGED: "Description changed",
};

interface Props { task: TaskWithRelations; }

export function TaskDetailClient({ task: initialTask }: Props) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [editOpen, setEditOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const { areas, tags } = useFormData();

  const callApi = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    // PATCH now returns the full task with history — no second GET needed.
    setTask(json.data);
  };

  const handleComplete = () =>
    callApi({ status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" });

  const handleArchive = () => {
    callApi({ status: "ARCHIVED" }).then(() => router.back());
  };

  const handleRestore = () => callApi({ status: "TODO" });

  const handlePermanentDelete = async () => {
    await fetch(`/api/tasks/${task.id}?permanent=true`, { method: "DELETE" });
    router.back();
  };

  const handleSubtaskCreate = async (data: CreateTaskInput) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, parentTaskId: task.id }),
    });
    const fresh = await fetch(`/api/tasks/${task.id}`).then((r) => r.json());
    setTask(fresh.data);
    setSubtaskOpen(false);
  };

  const latency = completionLatencyDays(task.createdAt, task.completedAt);

  const ghostBtn: React.CSSProperties = {
    background: "transparent", color: "var(--t2)",
    border: "1px solid rgba(215,172,97,0.20)", padding: "8px 14px",
    borderRadius: "9px", fontSize: "12.5px", cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: "6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Back + Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button style={ghostBtn} onClick={() => router.back()}>
          <ArrowLeft style={{ width: "15px", height: "15px" }} /> Back
        </button>
        <div style={{ display: "flex", gap: "8px" }}>
          {task.status !== "ARCHIVED" ? (
            <>
              <button style={ghostBtn} onClick={() => setEditOpen(true)}>
                <Edit2 style={{ width: "14px", height: "14px" }} /> Edit
              </button>
              <button style={ghostBtn} onClick={handleComplete}>
                {task.status === "COMPLETED" ? (
                  <><Circle style={{ width: "14px", height: "14px" }} /> Reopen</>
                ) : (
                  <><CheckCircle2 style={{ width: "14px", height: "14px" }} /> Complete</>
                )}
              </button>
              <button style={ghostBtn} onClick={handleArchive}>
                <Archive style={{ width: "14px", height: "14px" }} /> Archive
              </button>
            </>
          ) : (
            <button style={ghostBtn} onClick={handleRestore}>
              <RotateCcw style={{ width: "14px", height: "14px" }} /> Restore
            </button>
          )}
          <DeleteConfirmDialog onConfirm={handlePermanentDelete} taskTitle={task.title} />
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", fontWeight: 600, color: "var(--t1)", lineHeight: 1.2, display: "flex", alignItems: "center", gap: "10px" }}>
          {task.icon && <span>{task.icon}</span>}
          {task.title}
        </h1>
        {task.description && (
          <p style={{ marginTop: "10px", fontSize: "14px", color: "var(--t2)", lineHeight: 1.6, maxWidth: "640px", whiteSpace: "pre-wrap" }}>
            {task.description}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetaItem label="Status"><StatusBadge status={task.status} /></MetaItem>
        <MetaItem label="Priority"><PriorityBadge priority={task.priority} /></MetaItem>
        {task.deadline && (
          <MetaItem label="Deadline">
            <span className="flex items-center gap-1 text-sm text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {formatDate(task.deadline)}
            </span>
          </MetaItem>
        )}
        {task.area && (
          <MetaItem label="Area">
            <span className="flex items-center gap-1 text-sm" style={{ color: task.area.color }}>
              <Layers className="h-3.5 w-3.5" />
              {task.area.name}
            </span>
          </MetaItem>
        )}
        <MetaItem label="Created">
          <span className="text-sm text-slate-400">{formatDate(task.createdAt)}</span>
        </MetaItem>
        {task.completedAt && (
          <MetaItem label="Completed">
            <span className="text-sm text-green-400">{formatDate(task.completedAt)}</span>
          </MetaItem>
        )}
        {latency !== null && (
          <MetaItem label="Time to complete">
            <span className="text-sm text-slate-300">{latency} day{latency !== 1 ? "s" : ""}</span>
          </MetaItem>
        )}
        {task.repeatEnabled && (
          <MetaItem label="Recurring">
            <span className="flex items-center gap-1 text-sm text-indigo-400">
              <RepeatIcon className="h-3.5 w-3.5" />
              {task.repeatPattern?.toLowerCase()}
            </span>
          </MetaItem>
        )}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {task.tags.map((tt) => (
            <span key={tt.tagId} style={{
              fontFamily: "var(--font-mono)", fontSize: "11.5px",
              padding: "4px 11px", borderRadius: "7px",
              color: tt.tag.color, background: `${tt.tag.color}1c`,
              border: `1px solid ${tt.tag.color}40`,
            }}>#{tt.tag.name}</span>
          ))}
        </div>
      )}

      <div style={{ height: "1px", background: "rgba(215,172,97,0.14)" }} />

      {/* Subtasks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.16em", color: "var(--t2)" }}>
            SUBTASKS{task.subTasks.length > 0 ? ` · ${task.subTasks.length}` : ""}
          </h2>
          <button
            onClick={() => setSubtaskOpen(true)}
            style={{ background: "transparent", border: "1px solid rgba(215,172,97,0.20)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", color: "var(--t2)", cursor: "pointer" }}
          >
            + Add subtask
          </button>
        </div>
        {task.subTasks.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {task.subTasks.map((sub) => (
              <TaskCard key={sub.id} task={sub} compact />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--t3)" }}>No subtasks yet.</p>
        )}
      </div>

      <div style={{ height: "1px", background: "rgba(215,172,97,0.14)" }} />

      {/* History */}
      {task.history && task.history.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.16em", color: "var(--t2)", marginBottom: "16px" }}>HISTORY</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {task.history.map((h) => (
              <HistoryEntry key={h.id} entry={h} />
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <TaskForm
            areas={areas}
            tags={tags}
            defaultValues={{
              title: task.title,
              description: task.description ?? "",
              priority: task.priority,
              status: task.status,
              deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
              areaId: task.areaId ?? "",
              tagIds: task.tags.map((tt) => tt.tagId),
              repeatEnabled: task.repeatEnabled,
              repeatPattern: task.repeatPattern ?? undefined,
            }}
            onSubmit={async (data) => {
              await callApi({ ...data, deadline: data.deadline || null });
              setEditOpen(false);
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Subtask dialog */}
      <Dialog open={subtaskOpen} onOpenChange={setSubtaskOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add Subtask</DialogTitle></DialogHeader>
          <TaskForm
            areas={areas}
            tags={tags}
            defaultAreaId={task.areaId ?? undefined}
            onSubmit={handleSubtaskCreate}
            onCancel={() => setSubtaskOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--glass2)", border: "1px solid rgba(215,172,97,0.14)", borderRadius: "12px", padding: "14px 16px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "0.14em", color: "var(--t3)", marginBottom: "7px" }}>{label}</p>
      {children}
    </div>
  );
}

function DeleteConfirmDialog({ onConfirm, taskTitle }: { onConfirm: () => void; taskTitle: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button style={{ background: "transparent", color: "#D9544E", border: "1px solid rgba(217,84,78,0.3)", padding: "8px 14px", borderRadius: "9px", fontSize: "12.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Trash2 style={{ width: "14px", height: "14px" }} /> Delete
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-slate-300">&ldquo;{taskTitle}&rdquo;</span> will be permanently removed
            and cannot be recovered. This also detaches any subtasks (they become standalone inbox items).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete permanently</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function HistoryEntry({ entry }: { entry: TaskHistory }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", paddingBottom: "18px", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--accent)", marginTop: "4px" }} />
        <span style={{ width: "1px", flex: 1, background: "rgba(215,172,97,0.2)", marginTop: "4px" }} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontSize: "13px", color: "var(--t1)" }}>
          {HISTORY_LABELS[entry.action] ?? entry.action}
          {entry.oldValue && entry.newValue && (
            <span style={{ color: "var(--t3)" }}> · <span style={{ textDecoration: "line-through" }}>{entry.oldValue}</span> → {entry.newValue}</span>
          )}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--t3)", whiteSpace: "nowrap" }}>{formatRelative(entry.timestamp)}</span>
      </div>
    </div>
  );
}
