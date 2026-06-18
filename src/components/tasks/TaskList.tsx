"use client";
import { useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { useAreas } from "@/hooks/useAreas";
import { useTags } from "@/hooks/useTags";
import type { TaskStatus, Priority } from "@/types";

interface TaskListProps {
  title: string;
  description?: string;
  defaultFilters?: {
    status?: TaskStatus[];
    areaId?: string;
    tagId?: string;
    inbox?: boolean;
    includeArchived?: boolean;
  };
  showSearch?: boolean;
  showFilters?: boolean;
  showCreate?: boolean;
  defaultAreaId?: string;
  emptyMessage?: string;
}

export function TaskList({
  title,
  description,
  defaultFilters = {},
  showSearch = true,
  showFilters = true,
  showCreate = true,
  defaultAreaId,
  emptyMessage = "No tasks here yet.",
}: TaskListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const resolvedStatus: TaskStatus[] =
    statusFilter === "active"
      ? ["TODO", "IN_PROGRESS"]
      : statusFilter === "completed"
      ? ["COMPLETED"]
      : statusFilter === "all"
      ? []
      : [];

  const { tasks, loading, createTask, updateTask } = useTasks({
    ...defaultFilters,
    status: defaultFilters.status ?? resolvedStatus,
    search: search || undefined,
  });

  const { areas } = useAreas();
  const { tags } = useTags();

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, {
      status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        {showCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                areas={areas}
                tags={tags}
                defaultAreaId={defaultAreaId}
                onSubmit={async (data) => {
                  await createTask(data);
                  setDialogOpen(false);
                }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      {(showSearch || showFilters) && (
        <div className="flex gap-2 flex-wrap">
          {showSearch && (
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search tasks…"
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {showFilters && !defaultFilters.status?.length && (
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-16 text-center">
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
          {showCreate && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
