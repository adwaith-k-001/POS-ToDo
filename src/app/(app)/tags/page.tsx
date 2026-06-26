export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTags } from "@/services/tag.service";
import { TagsClient } from "./TagsClient";

export default async function TagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tags = await getTags(user.id);
  return <TagsClient tags={tags} />;
}
