"use client";
import { useRouter } from "next/navigation";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "#D9544E",
  HIGH:   "#D98A4E",
  MEDIUM: "#D4B454",
  LOW:    "#8A8576",
};

interface TaskCardProps {
  task: TaskWithRelations;
  onComplete?: (id: string) => void;
  compact?: boolean;
}

export function TaskCard({ task, onComplete, compact = false }: TaskCardProps) {
  const router = useRouter();
  const isDone = task.status === "COMPLETED";
  const overdue = isOverdue(task.deadline) && !isDone;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete?.(task.id);
  };

  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      style={{
        display: "flex", alignItems: "flex-start", gap: "14px",
        padding: "14px 18px", borderRadius: "14px", cursor: "pointer",
        background: "var(--glass)",
        border: "1px solid rgba(215,172,97,0.16)",
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        transition: "border-color .2s, transform .15s",
        opacity: isDone ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(215,172,97,0.38)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(215,172,97,0.16)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        style={{
          flexShrink: 0, marginTop: "2px",
          width: "18px", height: "18px", borderRadius: "50%",
          border: isDone ? "none" : "1.8px solid rgba(215,172,97,0.45)",
          background: isDone ? "var(--accent)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "border-color .2s, background .2s",
        }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.4 6.3l2.2 2.2 4.9-5.2" stroke="var(--ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "13.5px", color: isDone ? "var(--t3)" : "var(--t1)",
            textDecoration: isDone ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {task.icon && <span style={{ marginRight: "5px" }}>{task.icon}</span>}
            {task.title}
          </span>
          {task.priority && (
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
              background: PRIORITY_DOT[task.priority] ?? PRIORITY_DOT.LOW,
            }} />
          )}
        </div>

        {!compact && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", marginTop: "6px" }}>
            {task.deadline && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                color: overdue ? "#D9544E" : "var(--t3)",
                display: "flex", alignItems: "center", gap: "4px",
              }}>
                {overdue && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                )}
                {formatDate(task.deadline)}
              </span>
            )}

            {task.area && (
              <span style={{ fontSize: "11.5px", color: task.area.color ?? "var(--t3)" }}>
                {task.area.name}
              </span>
            )}

            {task.tags.slice(0, 2).map((tt) => (
              <span key={tt.tagId} style={{
                fontFamily: "var(--font-mono)", fontSize: "10.5px",
                padding: "2px 8px", borderRadius: "6px",
                color: tt.tag.color,
                background: `${tt.tag.color}1c`,
                border: `1px solid ${tt.tag.color}40`,
              }}>
                #{tt.tag.name}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span style={{ fontSize: "11px", color: "var(--t3)" }}>+{task.tags.length - 2}</span>
            )}

            {(task._count?.subTasks ?? 0) > 0 && (
              <span style={{ fontSize: "11px", color: "var(--t3)" }}>
                {task._count!.subTasks} subtasks
              </span>
            )}

            {task.repeatEnabled && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)" }}>
                ↻ {task.repeatPattern?.toLowerCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chevron */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--t3)", flexShrink: 0, marginTop: "3px", opacity: 0.5 }}>
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
