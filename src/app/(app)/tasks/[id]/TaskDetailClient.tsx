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
    // Re-fetch full task with history
    const fresh = await fetch(`/api/tasks/${task.id}`).then((r) => r.json());
    setTask(fresh.data);
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

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        {task.status !== "ARCHIVED" ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleComplete}>
              {task.status === "COMPLETED" ? (
                <><Circle className="h-4 w-4" /> Reopen</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Complete</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4" /> Archive
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={handleRestore}>
            <RotateCcw className="h-4 w-4" /> Restore
          </Button>
        )}
        <DeleteConfirmDialog onConfirm={handlePermanentDelete} taskTitle={task.title} />
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          {task.icon && <span>{task.icon}</span>}
          {task.title}
        </h1>
        {task.description && (
          <p className="mt-2 text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
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
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tt) => (
              <Badge key={tt.tagId} style={{ color: tt.tag.color, borderColor: `${tt.tag.color}40` }}>
                <Tag className="h-3 w-3 mr-1" /> {tt.tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Subtasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-300">
            Subtasks {task.subTasks.length > 0 && `(${task.subTasks.length})`}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSubtaskOpen(true)}>
            <Plus className="h-4 w-4" /> Add subtask
          </Button>
        </div>
        {task.subTasks.length > 0 ? (
          <div className="space-y-2">
            {task.subTasks.map((sub) => (
              <TaskCard key={sub.id} task={sub} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No subtasks.</p>
        )}
      </div>

      <Separator />

      {/* History */}
      {task.history && task.history.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-3">History</p>
          <div className="space-y-2">
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
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">{label}</p>
      {children}
    </div>
  );
}

function DeleteConfirmDialog({ onConfirm, taskTitle }: { onConfirm: () => void; taskTitle: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/40">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
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
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-700 shrink-0" />
      <div className="flex-1">
        <span className="text-slate-400">{HISTORY_LABELS[entry.action] ?? entry.action}</span>
        {entry.oldValue && entry.newValue && (
          <span className="text-slate-500"> · <span className="line-through">{entry.oldValue}</span> → {entry.newValue}</span>
        )}
      </div>
      <span className="text-xs text-slate-600 shrink-0">{formatRelative(entry.timestamp)}</span>
    </div>
  );
}
