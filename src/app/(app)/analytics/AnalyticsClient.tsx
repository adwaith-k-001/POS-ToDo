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
    <div style={{
      background: "var(--glass)", border: "1px solid rgba(215,172,97,0.16)",
      borderRadius: "14px", padding: "18px",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
    }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "0.13em", color: "var(--t3)" }}>{label}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 500, color: "var(--t1)", marginTop: "8px", letterSpacing: "-0.01em" }}>{value ?? "—"}</p>
      {sub && <p style={{ fontSize: "11px", color: "var(--t3)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.14em", color: "var(--t2)", margin: "30px 0 14px" }}>{title.toUpperCase()}</div>;
}

export function AnalyticsClient({ data }: Props) {
  const { overview, latency, deadline, byArea, trends } = data;

  const chartData = trends.slice(-30).map((t) => ({
    ...t,
    date: format(new Date(t.date), "MMM d"),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "8px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 600, color: "var(--t1)" }}>Analytics</h1>
        <p style={{ fontSize: "13.5px", color: "var(--t3)", marginTop: "4px" }}>Your productivity at a glance. Trends, not judgments.</p>
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
        <div style={{
          background: "var(--glass)", border: "1px solid rgba(215,172,97,0.16)",
          borderRadius: "16px", padding: "24px",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 12px 36px rgba(0,0,0,0.24)",
        }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(215,172,97,0.10)" />
              <XAxis dataKey="date" stroke="var(--t3)" tick={{ fontSize: 11, fill: "var(--t3)", fontFamily: "IBM Plex Mono" }} tickLine={false} />
              <YAxis stroke="var(--t3)" tick={{ fontSize: 11, fill: "var(--t3)", fontFamily: "IBM Plex Mono" }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1611", border: "1px solid rgba(215,172,97,0.28)", borderRadius: 10 }}
                labelStyle={{ color: "var(--t2)", fontSize: 12 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--t2)" }} />
              <Line type="monotone" dataKey="created" stroke="rgba(215,172,97,0.5)" dot={false} strokeWidth={2} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="#D7AC61" dot={false} strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Area Stats */}
      {byArea.length > 0 && (
        <section>
          <SectionHeader title="By Area" />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {byArea.map(({ area, created, completed, completionRate, avgCompletionDays }) => (
              <div key={area.id} style={{
                background: "var(--glass)", border: "1px solid rgba(215,172,97,0.16)",
                borderRadius: "14px", padding: "18px",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {area.icon && <span style={{ fontSize: "18px" }}>{area.icon}</span>}
                    <span style={{ fontSize: "14.5px", color: "var(--t1)" }}>{area.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: area.color }}>
                    {completionRate}%
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  {[
                    { label: "Created", val: created },
                    { label: "Completed", val: completed },
                    { label: "Avg time", val: avgCompletionDays !== null ? `${avgCompletionDays}d` : "—" },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--t1)" }}>{val}</div>
                      <div style={{ fontSize: "11px", color: "var(--t3)", marginTop: "2px" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: "7px", borderRadius: "4px", background: "rgba(215,172,97,0.10)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "4px", background: area.color, width: `${completionRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
