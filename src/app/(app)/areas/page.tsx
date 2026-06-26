import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getAreas } from "@/services/area.service";
import { AreasClient } from "./AreasClient";

export default async function AreasPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const areas = await getAreas(user.id);
  return <AreasClient areas={areas} />;
}
