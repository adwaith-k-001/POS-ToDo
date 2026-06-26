import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask, archiveTask, permanentlyDeleteTask } from "@/services/task.service";
import { updateTaskSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const task = await getTaskById(userId!, id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: task });
  } catch {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    await updateTask(userId!, id, parsed.data);
    // Return the full task with history so clients don't need a second GET.
    const task = await getTaskById(userId!, id);
    return NextResponse.json({ data: task });
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const permanent = req.nextUrl.searchParams.get("permanent") === "true";
    if (permanent) {
      await permanentlyDeleteTask(userId!, id);
    } else {
      await archiveTask(userId!, id);
    }
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
