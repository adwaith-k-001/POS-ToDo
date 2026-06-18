import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "@/services/task.service";
import { createTaskSchema } from "@/lib/validations";
import type { TaskStatus, Priority } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.getAll("status") as TaskStatus[];
    const priority = searchParams.getAll("priority") as Priority[];
    const areaId = searchParams.get("areaId") ?? undefined;
    const tagId = searchParams.get("tagId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const inbox = searchParams.get("inbox") === "true";
    const includeArchived = searchParams.get("includeArchived") === "true";

    const goalId = searchParams.get("goalId") ?? undefined;
    const dueBefore = searchParams.get("dueBefore") ? new Date(searchParams.get("dueBefore")!) : undefined;
    const dueAfter = searchParams.get("dueAfter") ? new Date(searchParams.get("dueAfter")!) : undefined;

    const tasks = await getTasks({ status, priority, areaId, tagId, search, inbox, includeArchived, goalId, dueBefore, dueAfter });
    return NextResponse.json({ data: tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const task = await createTask(parsed.data);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
