"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { useFormData } from "@/hooks/useFormData";
import type { TaskStatus } from "@/types";

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
    statusFilter === "active"   ? ["TODO", "IN_PROGRESS"]
    : statusFilter === "completed" ? ["COMPLETED"]
    : [];

  const { tasks, loading, createTask, updateTask } = useTasks({
    ...defaultFilters,
    status: defaultFilters.status ?? resolvedStatus,
    search: search || undefined,
  });

  const { areas, tags } = useFormData();

  const filteredTasks = tasks.filter((t) =>
    priorityFilter === "all" ? true : t.priority === priorityFilter
  );

  const handleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, { status: task.status === "COMPLETED" ? "TODO" : "COMPLETED" });
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, display: "flex", alignItems: "center", gap: "9px",
    background: "var(--glass2)", border: "1px solid rgba(215,172,97,0.16)",
    borderRadius: "10px", padding: "10px 14px",
    WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>{title}</h1>
          {description && (
            <p style={{ fontSize: "13.5px", color: "var(--t3)", marginTop: "4px" }}>{description}</p>
          )}
        </div>
        {showCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button style={{
                background: "var(--accent)", color: "var(--ink)", border: "none",
                padding: "10px 18px", borderRadius: "10px", fontSize: "13.5px",
                fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "0 5px 18px rgba(215,172,97,0.4)",
              }}>
                + New Task
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <TaskForm
                areas={areas}
                tags={tags}
                defaultAreaId={defaultAreaId}
                onSubmit={async (data) => { await createTask(data); setDialogOpen(false); }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "22px 0 18px" }}>
        <div style={inputStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: "var(--t3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: "var(--t1)", fontSize: "13px", width: "100%", fontFamily: "var(--font-sans)" }}
          />
        </div>

        {showFilters && !defaultFilters.status?.length && (
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger style={{ background: "var(--glass2)", border: "1px solid rgba(215,172,97,0.16)", borderRadius: "10px", color: "var(--t2)", fontSize: "13px", padding: "10px 14px", width: "auto", minWidth: "110px" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger style={{ background: "var(--glass2)", border: "1px solid rgba(215,172,97,0.16)", borderRadius: "10px", color: "var(--t2)", fontSize: "13px", padding: "10px 14px", width: "auto", minWidth: "130px" }}>
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

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: "72px", borderRadius: "14px", background: "var(--glass2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ border: "1px dashed rgba(215,172,97,0.3)", borderRadius: "14px", padding: "40px", textAlign: "center", background: "rgba(215,172,97,0.03)" }}>
          <div style={{ fontSize: "13.5px", color: "var(--t2)", marginBottom: "4px" }}>{emptyMessage}</div>
          {showCreate && (
            <button
              onClick={() => setDialogOpen(true)}
              style={{ marginTop: "10px", background: "transparent", border: "1px solid rgba(215,172,97,0.24)", borderRadius: "8px", padding: "7px 14px", fontSize: "12.5px", color: "var(--t2)", cursor: "pointer" }}
            >
              + Add task
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
