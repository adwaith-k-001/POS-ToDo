import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getAnalyticsSummary } from "@/services/analytics.service";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const data = await getAnalyticsSummary(user.id);
  return <AnalyticsClient data={data} />;
}
