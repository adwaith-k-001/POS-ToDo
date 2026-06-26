import { NextRequest, NextResponse } from "next/server";
import { getAreas, createArea } from "@/services/area.service";
import { createAreaSchema } from "@/lib/validations";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET() {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const areas = await getAreas(userId!);
    return NextResponse.json({ data: areas });
  } catch {
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = createAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const area = await createArea(userId!, parsed.data);
    return NextResponse.json({ data: area }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create area" }, { status: 500 });
  }
}
