import { NextResponse } from "next/server";
import { getAreas } from "@/services/area.service";
import { getTags } from "@/services/tag.service";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET() {
  const { userId, errorResponse } = await getAuthenticatedUser();
  if (errorResponse) return errorResponse;

  const [areas, tags] = await Promise.all([
    getAreas(userId!),
    getTags(userId!),
  ]);
  return NextResponse.json({ areas, tags });
}
