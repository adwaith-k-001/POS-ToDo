import { NextRequest, NextResponse } from "next/server";
import { getHabits, getMonthEntries, getMonthStats } from "@/services/tracker.service";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = req.nextUrl;
    const today = new Date();
    const year = parseInt(searchParams.get("year") ?? String(today.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(today.getMonth() + 1), 10);

    const habits = await getHabits(userId!);
    const habitIds = habits.map((h) => h.id);
    const [entries, stats] = await Promise.all([
      getMonthEntries(userId!, year, month, habitIds),
      getMonthStats(userId!, habits, year, month),
    ]);

    return NextResponse.json({ data: { habits, entries, stats } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tracker data" }, { status: 500 });
  }
}
