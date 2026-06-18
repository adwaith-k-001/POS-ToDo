import { NextRequest, NextResponse } from "next/server";
import { getTagById, updateTag, deleteTag } from "@/services/tag.service";
import { updateTagSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tag = await getTagById(id);
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    return NextResponse.json({ data: tag });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const tag = await updateTag(id, parsed.data);
    return NextResponse.json({ data: tag });
  } catch {
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteTag(id);
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
