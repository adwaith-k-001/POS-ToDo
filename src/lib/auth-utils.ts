import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  // getSession() reads the JWT from the HTTP-only cookie locally — no network call.
  // getUser() would verify with Supabase auth server (~200ms network round-trip).
  // Acceptable for a personal app; JWT expiry (1h) limits the staleness window.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return {
      user: null,
      userId: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { user, userId: user.id, errorResponse: null } as const;
}
