import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/services/analytics.service";

export async function GET() {
  try {
    const data = await getAnalyticsSummary();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
