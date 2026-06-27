"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
} from "lucide-react";
import { format, getDaysInMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntryData, HabitStats } from "@/services/tracker.service";

// ── Client-side stats (current month only; streaks are approximate for past months) ──

function computeClientStats(
  habits: Habit[],
  entries: HabitEntryData[],
  year: number,
  month: number,
): HabitStats[] {
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  return habits.map((habit) => {
    const map = new Map<number, number>(
      entries
        .filter((e) => e.habitId === habit.id)
        .map((e) => [parseInt(e.date.slice(8, 10), 10), e.value]),
    );

    let total = 0;
    let metDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const v = map.get(d) ?? 0;
      if (habit.type === "NUMERIC") total += v;
      const met = habit.type === "NUMERIC" ? v >= habit.target : v === 1;
      if (met) metDays++;
    }

    const endDay = Math.min(daysElapsed, daysInMonth);
    let streak = 0;
    for (let d = endDay; d >= 1; d--) {
      const v = map.get(d) ?? 0;
      const met = habit.type === "NUMERIC" ? v >= habit.target : v === 1;
      if (!met) break;
      streak++;
    }

    const completionPct =
      daysElapsed > 0 ? Math.round((metDays / daysElapsed) * 100) : 0;
    const avgMinutes =
      daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;

    return { habitId: habit.id, streak, completionPct, totalMinutes: total, avgMinutes };
  });
}

// ── Numeric input cell ──

interface NumericCellProps {
  value: number;
  target: number;
  disabled: boolean;
  onSave: (v: number) => void;
}

function NumericCell({ value, target, disabled, onSave }: NumericCellProps) {
  const [local, setLocal] = useState(value === 0 ? "" : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value === 0 ? "" : String(value));
  }, [value, focused]);

  const met = !focused && value > 0 && value >= target;

  const commit = useCallback(() => {
    const num = Math.max(0, parseInt(local, 10) || 0);
    if (num !== value) onSave(num);
  }, [local, value, onSave]);

  return (
    <input
      type="number"
      min="0"
      value={local}
      placeholder="—"
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setLocal(value === 0 ? "" : String(value));
          e.currentTarget.blur();
        }
      }}
      className={cn(
        "w-7 h-7 text-center text-[11px] rounded transition-colors",
        "bg-transparent border border-transparent",
        "text-slate-500 placeholder-slate-800",
        "focus:outline-none focus:border-indigo-500/40 focus:bg-slate-800/50 focus:text-slate-200",
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        met && "bg-amber-400/10 border-amber-400/25 !text-amber-300 font-medium",
        disabled && "opacity-25 cursor-not-allowed pointer-events-none",
      )}
    />
  );
}

// ── Checkbox cell ──

interface CheckboxCellProps {
  value: number;
  disabled: boolean;
  onToggle: () => void;
}

function CheckboxCell({ value, disabled, onToggle }: CheckboxCellProps) {
  const checked = value === 1;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center transition-colors border",
        "focus:outline-none focus:ring-1 focus:ring-indigo-500/50",
        checked
          ? "bg-amber-400/10 border-amber-400/25 text-amber-400"
          : "bg-transparent border-slate-800 text-transparent hover:border-slate-600",
        disabled && "opacity-25 cursor-not-allowed pointer-events-none",
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  );
}

// ── Main component ──

interface Props {
  initialHabits: Habit[];
  initialEntries: HabitEntryData[];
  initialStats: HabitStats[];
  year: number;
  month: number;
}

export function TrackerClient({
  initialHabits,
  initialEntries,
  initialStats,
  year: initYear,
  month: initMonth,
}: Props) {
  const [currentDate, setCurrentDate] = useState(
    new Date(initYear, initMonth - 1, 1),
  );
  const [entries, setEntries] = useState<HabitEntryData[]>(initialEntries);
  const [stats, setStats] = useState<HabitStats[]>(initialStats);
  const [habits] = useState<Habit[]>(initialHabits);
  const [navLoading, setNavLoading] = useState(false);
  const pendingSave = useRef<AbortController | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const daysInMonth = getDaysInMonth(currentDate);
  const today = new Date();

  const entriesMap = useMemo(() => {
    const map = new Map<string, Map<number, number>>();
    for (const e of entries) {
      const day = parseInt(e.date.slice(8, 10), 10);
      if (!map.has(e.habitId)) map.set(e.habitId, new Map());
      map.get(e.habitId)!.set(day, e.value);
    }
    return map;
  }, [entries]);

  const statsMap = useMemo(
    () => new Map(stats.map((s) => [s.habitId, s])),
    [stats],
  );

  const getCellValue = (habitId: string, day: number) =>
    entriesMap.get(habitId)?.get(day) ?? 0;

  const isFutureDay = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    day > today.getDate();

  const isTodayDay = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day;

  const navigateMonth = async (dir: -1 | 1) => {
    const newDate = dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
    setNavLoading(true);
    try {
      const y = newDate.getFullYear();
      const m = newDate.getMonth() + 1;
      const res = await fetch(`/api/tracker?year=${y}&month=${m}`);
      const data = await res.json();
      setEntries(data.data.entries);
      setStats(data.data.stats);
    } finally {
      setNavLoading(false);
    }
  };

  const updateEntry = useCallback(
    async (habitId: string, day: number, value: number) => {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Optimistic entry update
      const newEntries = (() => {
        const idx = entries.findIndex(
          (e) => e.habitId === habitId && e.date === dateStr,
        );
        if (value === 0) {
          return idx >= 0 ? entries.filter((_, i) => i !== idx) : entries;
        }
        if (idx >= 0) {
          return entries.map((e, i) =>
            i === idx ? { ...e, value } : e,
          );
        }
        return [...entries, { id: "opt-" + Date.now(), habitId, date: dateStr, value }];
      })();

      setEntries(newEntries);
      setStats(computeClientStats(habits, newEntries, year, month));

      // Persist (cancel any in-flight request for the same cell is not needed
      // since we always want to persist the latest value)
      try {
        const res = await fetch("/api/tracker/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: dateStr, value }),
        });
        if (res.ok) {
          const data = await res.json();
          // Replace optimistic entry with real ID
          setEntries((prev) =>
            prev.map((e) =>
              e.id.startsWith("opt-") && e.habitId === habitId && e.date === dateStr
                ? data.data
                : e,
            ),
          );
        }
      } catch {
        // Silently ignore — optimistic state stays
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, month, entries, habits],
  );

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Add week-separator left border to days 8, 15, 22, 29
  const isWeekStart = (day: number) => day > 1 && (day - 1) % 7 === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "8px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>Tracker</h1>
          <p style={{ fontSize: "13.5px", color: "var(--t3)", marginTop: "4px" }}>Non-negotiables, one month at a glance.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => navigateMonth(-1)}
            style={{ width: "32px", height: "32px", borderRadius: "9px", border: "1px solid rgba(215,172,97,0.16)", background: "var(--glass2)", color: "var(--t2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--t1)", minWidth: "120px", textAlign: "center" }}>
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            style={{ width: "32px", height: "32px", borderRadius: "9px", border: "1px solid rgba(215,172,97,0.16)", background: "var(--glass2)", color: "var(--t2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={cn(
          navLoading && "opacity-50 pointer-events-none",
        )}
        style={{
          overflowX: "auto", borderRadius: "16px",
          border: "1px solid rgba(215,172,97,0.16)",
          background: "var(--glass)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.28)",
        }}
      >
        <table className="w-max border-collapse">
          <thead>
            <tr>
              {/* Habit name header */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-slate-900 w-28 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-800"
              >
                Habit
              </th>

              {/* Day headers */}
              {days.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={cn(
                    "w-8 py-2.5 text-center text-[11px] font-medium border-b border-slate-800",
                    isWeekStart(day) && "border-l border-l-slate-700",
                    isTodayDay(day)
                      ? "text-indigo-400 font-semibold"
                      : "text-slate-700",
                  )}
                >
                  {day}
                </th>
              ))}

              {/* Stats headers */}
              <th
                scope="col"
                className="border-l border-slate-700 border-b border-slate-800 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 text-center w-10"
              >
                <Flame className="h-3 w-3 mx-auto" />
              </th>
              <th
                scope="col"
                className="border-b border-slate-800 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 text-center w-10"
              >
                %
              </th>
              <th
                scope="col"
                className="border-b border-slate-800 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 text-center w-16 whitespace-nowrap"
              >
                Total
              </th>
              <th
                scope="col"
                className="border-b border-slate-800 px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 text-center w-12 whitespace-nowrap"
              >
                Avg
              </th>
            </tr>
          </thead>

          <tbody>
            {habits.map((habit) => {
              const s = statsMap.get(habit.id);
              return (
                <tr key={habit.id} className="group hover:bg-slate-800/20 transition-colors">
                  {/* Habit name — sticky */}
                  <td className="sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900/80 px-3 py-1.5 border-b border-slate-800/60 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-300 leading-tight">
                        {habit.name}
                      </p>
                      <p className="text-[10px] text-slate-700 mt-0.5">
                        {habit.type === "NUMERIC"
                          ? `goal: ${habit.target} min`
                          : "binary"}
                      </p>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map((day) => {
                    const value = getCellValue(habit.id, day);
                    const future = isFutureDay(day);
                    return (
                      <td
                        key={day}
                        className={cn(
                          "p-0.5 border-b border-slate-800/60 text-center align-middle",
                          isWeekStart(day) && "border-l border-l-slate-700/60",
                          isTodayDay(day) && "bg-indigo-950/20",
                        )}
                      >
                        {habit.type === "NUMERIC" ? (
                          <NumericCell
                            value={value}
                            target={habit.target}
                            disabled={future}
                            onSave={(v) => updateEntry(habit.id, day, v)}
                          />
                        ) : (
                          <CheckboxCell
                            value={value}
                            disabled={future}
                            onToggle={() =>
                              updateEntry(habit.id, day, value === 1 ? 0 : 1)
                            }
                          />
                        )}
                      </td>
                    );
                  })}

                  {/* Stats */}
                  <td className="border-l border-slate-700/60 border-b border-slate-800/60 px-2 py-1.5 text-center whitespace-nowrap">
                    {s && s.streak > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-400">
                        <Flame className="h-3 w-3" />
                        {s.streak}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-800">—</span>
                    )}
                  </td>

                  <td className="border-b border-slate-800/60 px-2 py-1.5 text-center">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        s && s.completionPct >= 80
                          ? "text-emerald-400"
                          : s && s.completionPct >= 50
                          ? "text-amber-400"
                          : "text-slate-600",
                      )}
                    >
                      {s ? `${s.completionPct}%` : "—"}
                    </span>
                  </td>

                  <td className="border-b border-slate-800/60 px-2 py-1.5 text-center">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {s && habit.type === "NUMERIC"
                        ? `${s.totalMinutes}m`
                        : "—"}
                    </span>
                  </td>

                  <td className="border-b border-slate-800/60 px-2 py-1.5 text-center">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {s && habit.type === "NUMERIC"
                        ? `${s.avgMinutes}m`
                        : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400/10 border border-amber-400/25 inline-block" />
          Goal met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-950/40 inline-block" />
          Today
        </span>
        <span className="text-slate-800">
          Numbers = minutes &nbsp;·&nbsp; Empty = no entry
        </span>
      </div>
    </div>
  );
}
