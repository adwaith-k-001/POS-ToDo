import { NextRequest, NextResponse } from "next/server";
import { getAreaById, updateArea, deleteArea } from "@/services/area.service";
import { updateAreaSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const area = await getAreaById(userId!, id);
    if (!area) return NextResponse.json({ error: "Area not found" }, { status: 404 });
    return NextResponse.json({ data: area });
  } catch {
    return NextResponse.json({ error: "Failed to fetch area" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const area = await updateArea(userId!, id, parsed.data);
    return NextResponse.json({ data: area });
  } catch {
    return NextResponse.json({ error: "Failed to update area" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await deleteArea(userId!, id);
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete area" }, { status: 500 });
  }
}
