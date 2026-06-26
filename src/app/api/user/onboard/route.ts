import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { seedDefaultHabits } from "@/services/tracker.service";

export async function POST() {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  await seedDefaultHabits(userId!);
  return NextResponse.json({ data: { ok: true } });
}
