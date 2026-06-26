export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAreas } from "@/services/area.service";
import { AreasClient } from "./AreasClient";

export default async function AreasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const areas = await getAreas(user.id);
  return <AreasClient areas={areas} />;
}
