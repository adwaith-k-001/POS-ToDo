import { prisma } from "@/lib/prisma";
import { differenceInDays, subDays, format } from "date-fns";
import type {
  OverviewStats,
  LatencyStats,
  DeadlineStats,
  AreaStat,
  TrendPoint,
  AnalyticsSummary,
} from "@/types";

export async function getOverviewStats(userId: string): Promise<OverviewStats> {
  // Single query with conditional aggregation instead of 5 parallel round-trips.
  const [row] = await prisma.$queryRaw<
    Array<{ total: bigint; completed: bigint; archived: bigint; active: bigint; overdue: bigint }>
  >`
    SELECT
      COUNT(*)                                                                                          AS total,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')                                                     AS completed,
      COUNT(*) FILTER (WHERE status = 'ARCHIVED')                                                      AS archived,
      COUNT(*) FILTER (WHERE status IN ('TODO', 'IN_PROGRESS'))                                        AS active,
      COUNT(*) FILTER (WHERE status IN ('TODO', 'IN_PROGRESS') AND deadline < NOW())                   AS overdue
    FROM "Task"
    WHERE "userId" = ${userId} AND "parentTaskId" IS NULL
  `;

  const total     = Number(row.total);
  const completed = Number(row.completed);
  return {
    totalCreated: total,
    totalCompleted: completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    activeTasks: Number(row.active),
    overdueTasks: Number(row.overdue),
    archivedTasks: Number(row.archived),
  };
}

export async function getLatencyStats(userId: string): Promise<LatencyStats> {
  const tasks = await prisma.task.findMany({
    where: { userId, status: "COMPLETED", completedAt: { not: null }, parentTaskId: null },
    select: { createdAt: true, completedAt: true },
  });

  if (!tasks.length) return { average: null, median: null, fastest: null, slowest: null };

  const days = tasks
    .map((t) => differenceInDays(t.completedAt!, t.createdAt))
    .sort((a, b) => a - b);

  const sum = days.reduce((a, b) => a + b, 0);
  const mid = Math.floor(days.length / 2);

  return {
    average: Math.round((sum / days.length) * 10) / 10,
    median:
      days.length % 2 === 0
        ? Math.round(((days[mid - 1] + days[mid]) / 2) * 10) / 10
        : days[mid],
    fastest: days[0],
    slowest: days[days.length - 1],
  };
}

export async function getDeadlineStats(userId: string): Promise<DeadlineStats> {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { not: null },
      deadline: { not: null },
      parentTaskId: null,
    },
    select: { completedAt: true, deadline: true },
  });

  if (!tasks.length) return { onTime: 0, late: 0, successRate: 0, averageDelayDays: null };

  let onTime = 0;
  const delays: number[] = [];

  for (const t of tasks) {
    const diff = differenceInDays(t.completedAt!, t.deadline!);
    if (diff <= 0) {
      onTime++;
    } else {
      delays.push(diff);
    }
  }

  return {
    onTime,
    late: delays.length,
    successRate: Math.round((onTime / tasks.length) * 100),
    averageDelayDays:
      delays.length > 0
        ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10
        : null,
  };
}

export async function getAreaStats(userId: string): Promise<AreaStat[]> {
  const areas = await prisma.area.findMany({
    where: { userId },
    include: {
      tasks: {
        where: { parentTaskId: null },
        select: { status: true, createdAt: true, completedAt: true },
      },
    },
  });

  return areas.map((area) => {
    const tasks = area.tasks;
    const completed = tasks.filter((t) => t.status === "COMPLETED" && t.completedAt);
    const days = completed.map((t) => differenceInDays(t.completedAt!, t.createdAt));

    return {
      area,
      created: tasks.length,
      completed: completed.length,
      completionRate:
        tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      avgCompletionDays:
        days.length > 0
          ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10
          : null,
    };
  });
}

export async function getTrends(userId: string, days = 30): Promise<TrendPoint[]> {
  const since = subDays(new Date(), days);

  const [created, completed] = await Promise.all([
    prisma.task.findMany({
      where: { userId, createdAt: { gte: since }, parentTaskId: null },
      select: { createdAt: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        completedAt: { gte: since },
        status: "COMPLETED",
        parentTaskId: null,
      },
      select: { completedAt: true },
    }),
  ]);

  const points: Record<string, TrendPoint> = {};
  for (let i = days; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    points[d] = { date: d, created: 0, completed: 0 };
  }

  for (const t of created) {
    const d = format(t.createdAt, "yyyy-MM-dd");
    if (points[d]) points[d].created++;
  }
  for (const t of completed) {
    const d = format(t.completedAt!, "yyyy-MM-dd");
    if (points[d]) points[d].completed++;
  }

  return Object.values(points);
}

export async function getAnalyticsSummary(userId: string): Promise<AnalyticsSummary> {
  const [overview, latency, deadline, byArea, trends] = await Promise.all([
    getOverviewStats(userId),
    getLatencyStats(userId),
    getDeadlineStats(userId),
    getAreaStats(userId),
    getTrends(userId, 30),
  ]);

  return { overview, latency, deadline, byArea, trends };
}
