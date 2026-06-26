import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/services/analytics.service";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET() {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const data = await getAnalyticsSummary(userId!);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
