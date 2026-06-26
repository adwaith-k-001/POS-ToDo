import { prisma } from "@/lib/prisma";

export type HabitType = "NUMERIC" | "CHECKBOX";

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  target: number;
  order: number;
}

export interface HabitEntryData {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface HabitStats {
  habitId: string;
  streak: number;
  completionPct: number;
  totalMinutes: number;
  avgMinutes: number;
}

const DEFAULT_HABITS: Omit<Habit, "id">[] = [
  { name: "Reading", type: "NUMERIC", target: 30, order: 0 },
  { name: "Learning", type: "NUMERIC", target: 30, order: 1 },
  { name: "Studying", type: "NUMERIC", target: 120, order: 2 },
  { name: "Exercise", type: "NUMERIC", target: 30, order: 3 },
  { name: "Sleep", type: "CHECKBOX", target: 1, order: 4 },
];

export async function seedDefaultHabits(userId: string): Promise<void> {
  const existing = await prisma.habit.count({ where: { userId } });
  if (existing > 0) return;

  await prisma.habit.createMany({
    data: DEFAULT_HABITS.map((h) => ({ ...h, userId })),
  });
}

export async function getHabits(userId: string): Promise<Habit[]> {
  const rows = await prisma.habit.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  return rows.map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type as HabitType,
    target: h.target,
    order: h.order,
  }));
}

export async function getMonthEntries(
  userId: string,
  year: number,
  month: number,
  knownHabitIds?: string[]
): Promise<HabitEntryData[]> {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const habitIds = knownHabitIds ?? (
    await prisma.habit.findMany({ where: { userId }, select: { id: true } })
  ).map((h) => h.id);

  const rows = await prisma.habitEntry.findMany({
    where: { habitId: { in: habitIds }, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  return rows.map((e) => ({
    id: e.id,
    habitId: e.habitId,
    date: e.date.toISOString().slice(0, 10),
    value: e.value,
  }));
}

export async function upsertEntry(
  userId: string,
  habitId: string,
  date: string,
  value: number
): Promise<HabitEntryData> {
  // Verify habit belongs to user
  await prisma.habit.findFirstOrThrow({ where: { id: habitId, userId } });

  const dateObj = new Date(date + "T00:00:00.000Z");

  if (value === 0) {
    await prisma.habitEntry.deleteMany({ where: { habitId, date: dateObj } });
    return { id: "", habitId, date, value: 0 };
  }

  const entry = await prisma.habitEntry.upsert({
    where: { habitId_date: { habitId, date: dateObj } },
    create: { habitId, date: dateObj, value },
    update: { value },
  });

  return {
    id: entry.id,
    habitId: entry.habitId,
    date: entry.date.toISOString().slice(0, 10),
    value: entry.value,
  };
}

export async function getMonthStats(
  userId: string,
  habits: Habit[],
  year: number,
  month: number
): Promise<HabitStats[]> {
  const today = new Date();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const isCurrentMonth =
    today.getUTCFullYear() === year && today.getUTCMonth() + 1 === month;

  const habitIds = habits.map((h) => h.id);
  const allEntries = await prisma.habitEntry.findMany({
    where: {
      habitId: { in: habitIds },
      date: { lte: new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59)) },
    },
    orderBy: { date: "asc" },
  });

  const endDay = isCurrentMonth
    ? Math.min(today.getUTCDate(), daysInMonth)
    : daysInMonth;

  const daysElapsed = isCurrentMonth ? today.getUTCDate() : daysInMonth;

  return habits.map((habit) => {
    const habitEntries = allEntries.filter((e) => e.habitId === habit.id);
    const entriesMap = new Map<string, number>(
      habitEntries.map((e) => [e.date.toISOString().slice(0, 10), e.value])
    );

    let total = 0;
    let metDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const v = entriesMap.get(ds) ?? 0;
      if (habit.type === "NUMERIC") total += v;
      const met = habit.type === "NUMERIC" ? v >= habit.target : v === 1;
      if (met) metDays++;
    }

    let streak = 0;
    let checkTs = Date.UTC(year, month - 1, endDay);
    while (true) {
      const ds = new Date(checkTs).toISOString().slice(0, 10);
      const v = entriesMap.get(ds) ?? 0;
      const met = habit.type === "NUMERIC" ? v >= habit.target : v === 1;
      if (!met) break;
      streak++;
      checkTs -= 86_400_000;
    }

    const completionPct =
      daysElapsed > 0 ? Math.round((metDays / daysElapsed) * 100) : 0;
    const avgMinutes = daysElapsed > 0 ? Math.round(total / daysElapsed) : 0;

    return { habitId: habit.id, streak, completionPct, totalMinutes: total, avgMinutes };
  });
}
