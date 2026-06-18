import { NextRequest, NextResponse } from "next/server";
import { getGoals, createGoal } from "@/services/goal.service";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const goals = await getGoals();
    return NextResponse.json({ data: goals });
  } catch {
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const goal = await createGoal(parsed.data);
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
