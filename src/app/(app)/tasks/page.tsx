"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useTasks } from "@/hooks/useTasks";
import { useFormData } from "@/hooks/useFormData";
import { formatDate } from "@/lib/utils";
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
    const d = now.getDay() === 0 ? 6 : 7 - now.getDay();
    dueBefore.setDate(now.getDate() + d);
  } else if (range === "month") {
    dueBefore.setMonth(now.getMonth() + 1);
  } else {
    dueBefore.setMonth(now.getMonth() + 3);
  }
  dueBefore.setHours(23, 59, 59, 999);
  return { dueAfter, dueBefore };
}

const VIEWS: { key: View; label: string }[] = [
  { key: "today",     label: "Today" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "all",       label: "All" },
  { key: "completed", label: "Completed" },
];

const LIST_LABELS: Record<View, string> = {
  today:     "DUE TODAY",
  upcoming:  "UPCOMING",
  all:       "ALL ACTIVE",
  completed: "COMPLETED",
};

const EMPTY_MSGS: Record<View, string> = {
  today:     "Nothing due today.",
  upcoming:  "No upcoming tasks.",
  all:       "No active tasks.",
  completed: "No completed tasks yet.",
};

function pill(on: boolean): React.CSSProperties {
  return {
    padding: "7px 15px", borderRadius: "9px", fontSize: "13px", cursor: "pointer",
    border: on ? "1px solid rgba(215,172,97,0.4)" : "1px solid rgba(215,172,97,0.14)",
    background: on ? "rgba(215,172,97,0.16)" : "var(--glass2)",
    color: on ? "var(--t1)" : "var(--t2)",
    fontWeight: on ? 500 : 400,
    transition: "all .2s", fontFamily: "var(--font-sans)",
  };
}

function subPill(on: boolean): React.CSSProperties {
  return {
    padding: "5px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer",
    border: "none", background: on ? "rgba(215,172,97,0.16)" : "transparent",
    color: on ? "var(--accent)" : "var(--t3)",
    transition: "all .2s", fontFamily: "var(--font-sans)",
  };
}

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

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "18px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>Tasks</h1>
        {view !== "completed" && (
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
                onSubmit={async (data) => { await createTask(data); setDialogOpen(false); }}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* View tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {VIEWS.map(({ key, label }) => (
          <button key={key} onClick={() => setView(key)} style={pill(view === key)}>{label}</button>
        ))}
      </div>

      {/* Upcoming range sub-tabs */}
      {view === "upcoming" && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          {(Object.keys(RANGE_LABELS) as UpcomingRange[]).map((r) => (
            <button key={r} onClick={() => setUpcomingRange(r)} style={subPill(upcomingRange === r)}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: "9px",
        background: "var(--glass2)", border: "1px solid rgba(215,172,97,0.16)",
        borderRadius: "10px", padding: "10px 14px",
      }}>
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

      {/* Section label */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.06em", color: "var(--t3)", margin: "20px 0 12px" }}>
        {LIST_LABELS[view]}{view === "all" && tasks.length > 0 ? ` · ${tasks.length}` : ""}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: "72px", borderRadius: "14px", background: "var(--glass2)" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ border: "1px dashed rgba(215,172,97,0.3)", borderRadius: "14px", padding: "40px", textAlign: "center", background: "rgba(215,172,97,0.03)" }}>
          <div style={{ fontSize: "13.5px", color: "var(--t2)" }}>{EMPTY_MSGS[view]}</div>
          {view !== "completed" && (
            <button
              onClick={() => setDialogOpen(true)}
              style={{ marginTop: "12px", background: "transparent", border: "1px solid rgba(215,172,97,0.24)", borderRadius: "8px", padding: "7px 14px", fontSize: "12.5px", color: "var(--t2)", cursor: "pointer" }}
            >
              + Add task
            </button>
          )}
        </div>
      ) : view === "completed" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 18px", borderRadius: "14px", cursor: "pointer",
                background: "var(--glass)", border: "1px solid rgba(215,172,97,0.14)",
                backdropFilter: "blur(20px)", opacity: 0.7,
              }}
            >
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.4 6.3l2.2 2.2 4.9-5.2" stroke="var(--ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13.5px", color: "var(--t3)", textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "3px" }}>
                  {task.completedAt && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--t3)" }}>
                      Completed {formatDate(task.completedAt)}
                    </span>
                  )}
                  {task.area && <span style={{ fontSize: "11.5px", color: task.area.color }}>{task.area.name}</span>}
                </div>
              </div>
              <button
                onClick={(e) => handleReopen(e, task)}
                style={{ background: "transparent", border: "1px solid rgba(215,172,97,0.2)", borderRadius: "7px", padding: "5px 10px", fontSize: "11.5px", color: "var(--t2)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ↺ Reopen
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
