import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag } from "@/services/tag.service";
import { createTagSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET() {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const tags = await getTags(userId!);
    return NextResponse.json({ data: tags });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const tag = await createTag(userId!, parsed.data);
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
