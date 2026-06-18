import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag } from "@/services/tag.service";
import { createTagSchema } from "@/lib/validations";

export async function GET() {
  try {
    const tags = await getTags();
    return NextResponse.json({ data: tags });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const tag = await createTag(parsed.data);
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
