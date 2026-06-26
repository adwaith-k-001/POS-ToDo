import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getOverviewStats } from "@/services/analytics.service";
import { getTasks } from "@/services/task.service";
import { formatDate, isOverdue, PRIORITY_COLORS } from "@/lib/utils";
import { CheckCircle2, Clock, TrendingUp, AlertTriangle, Circle, Archive, Activity } from "lucide-react";
import Link from "next/link";

async function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const [stats, recentTasks, upcomingTasks] = await Promise.all([
    getOverviewStats(user.id),
    getTasks(user.id, { status: ["TODO", "IN_PROGRESS"] }),
    getTasks(user.id, {
      status: ["TODO", "IN_PROGRESS"],
      dueBefore: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dueAfter: new Date(),
    }),
  ]);

  const overdueTasks = recentTasks.filter(
    (t) => t.deadline && isOverdue(t.deadline)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Created" value={stats.totalCreated} icon={Circle} color="bg-slate-800 text-slate-400" />
        <StatCard label="Completed" value={stats.totalCompleted} icon={CheckCircle2} color="bg-green-900/40 text-green-400" />
        <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={TrendingUp} color="bg-indigo-900/40 text-indigo-400" />
        <StatCard label="Active Tasks" value={stats.activeTasks} icon={Activity} color="bg-blue-900/40 text-blue-400" />
        <StatCard label="Overdue" value={stats.overdueTasks} icon={AlertTriangle} color="bg-red-900/40 text-red-400" />
        <StatCard label="Archived" value={stats.archivedTasks} icon={Archive} color="bg-slate-800 text-slate-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Active Tasks</h2>
            <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-2">
            {recentTasks.slice(0, 6).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors group"
              >
                <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                <span className="flex-1 text-sm text-slate-300 truncate">{task.title}</span>
                {task.priority !== "MEDIUM" && (
                  <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                )}
                {task.deadline && isOverdue(task.deadline) && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                )}
              </Link>
            ))}
            {recentTasks.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-4">No active tasks</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300">Upcoming (7 days)</h2>
            <Link href="/upcoming" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-2">
            {upcomingTasks.slice(0, 6).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors"
              >
                <Clock className="h-4 w-4 text-slate-600 shrink-0" />
                <span className="flex-1 text-sm text-slate-300 truncate">{task.title}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatDate(task.deadline)}</span>
              </Link>
            ))}
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-4">No upcoming deadlines</p>
            )}
          </div>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Overdue Tasks ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-red-900/20 transition-colors"
              >
                <span className="flex-1 text-sm text-slate-300 truncate">{task.title}</span>
                <span className="text-xs text-red-400">{formatDate(task.deadline)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
