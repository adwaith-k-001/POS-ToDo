export const dynamic = "force-dynamic";
import { getAnalyticsSummary } from "@/services/analytics.service";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const data = await getAnalyticsSummary();
  return <AnalyticsClient data={data} />;
}
