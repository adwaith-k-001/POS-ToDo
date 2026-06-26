import { NextRequest, NextResponse } from "next/server";
import { upsertEntry } from "@/services/tracker.service";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { z } from "zod";

const upsertSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().int().min(0),
});

export async function PUT(req: NextRequest) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const entry = await upsertEntry(userId!, parsed.data.habitId, parsed.data.date, parsed.data.value);
    return NextResponse.json({ data: entry });
  } catch {
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
