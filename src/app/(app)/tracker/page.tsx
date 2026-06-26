export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHabits, getMonthEntries, getMonthStats } from "@/services/tracker.service";
import { TrackerClient } from "./TrackerClient";

export default async function TrackerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const habits = await getHabits(user.id);
  const [entries, stats] = await Promise.all([
    getMonthEntries(user.id, year, month),
    getMonthStats(user.id, habits, year, month),
  ]);

  return (
    <TrackerClient
      initialHabits={habits}
      initialEntries={entries}
      initialStats={stats}
      year={year}
      month={month}
    />
  );
}
