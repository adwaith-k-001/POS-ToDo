import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";

export default async function FocusModePage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  return null;
}
