"use client";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { AnalyticsSummary } from "@/types";
import { format } from "date-fns";

interface Props { data: AnalyticsSummary; }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100">{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-slate-200 mb-4">{title}</h2>;
}

export function AnalyticsClient({ data }: Props) {
  const { overview, latency, deadline, byArea, trends } = data;

  const chartData = trends.slice(-30).map((t) => ({
    ...t,
    date: format(new Date(t.date), "MMM d"),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Your productivity at a glance.</p>
      </div>

      {/* Overview */}
      <section>
        <SectionHeader title="Overview" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total Created" value={overview.totalCreated} />
          <StatCard label="Completed" value={overview.totalCompleted} />
          <StatCard label="Completion Rate" value={`${overview.completionRate}%`} />
          <StatCard label="Active Tasks" value={overview.activeTasks} />
          <StatCard label="Overdue" value={overview.overdueTasks} />
          <StatCard label="Archived" value={overview.archivedTasks} />
        </div>
      </section>

      {/* Completion Latency */}
      <section>
        <SectionHeader title="Completion Latency" />
        <p className="text-xs text-slate-500 mb-4">
          Time between task creation and completion (days).
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Average" value={latency.average !== null ? `${latency.average}d` : "—"} />
          <StatCard label="Median" value={latency.median !== null ? `${latency.median}d` : "—"} />
          <StatCard label="Fastest" value={latency.fastest !== null ? `${latency.fastest}d` : "—"} />
          <StatCard label="Slowest" value={latency.slowest !== null ? `${latency.slowest}d` : "—"} />
        </div>
      </section>

      {/* Deadline Stats */}
      <section>
        <SectionHeader title="Deadline Performance" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="On Time" value={deadline.onTime} />
          <StatCard label="Late" value={deadline.late} />
          <StatCard label="Success Rate" value={`${deadline.successRate}%`} />
          <StatCard label="Avg Delay" value={deadline.averageDelayDays !== null ? `${deadline.averageDelayDays}d` : "—"} />
        </div>
      </section>

      {/* Trends chart */}
      <section>
        <SectionHeader title="30-Day Trend" />
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8", fontSize: 12 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="created" stroke="#6366f1" dot={false} strokeWidth={2} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" dot={false} strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Area Stats */}
      {byArea.length > 0 && (
        <section>
          <SectionHeader title="By Area" />
          <div className="space-y-3">
            {byArea.map(({ area, created, completed, completionRate, avgCompletionDays }) => (
              <div key={area.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{area.icon}</span>
                    <span className="font-medium text-slate-200">{area.name}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: area.color }}>
                    {completionRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-100">{created}</p>
                    <p className="text-xs text-slate-500">Created</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-100">{completed}</p>
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-100">
                      {avgCompletionDays !== null ? `${avgCompletionDays}d` : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Avg time</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${completionRate}%`, backgroundColor: area.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
