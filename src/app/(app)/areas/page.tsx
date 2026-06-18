export const dynamic = "force-dynamic";
import { getAreas } from "@/services/area.service";
import { AreasClient } from "./AreasClient";

export default async function AreasPage() {
  const areas = await getAreas();
  return <AreasClient areas={areas} />;
}
