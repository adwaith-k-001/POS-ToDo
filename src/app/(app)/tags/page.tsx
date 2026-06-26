import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getTags } from "@/services/tag.service";
import { TagsClient } from "./TagsClient";

export default async function TagsPage() {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const tags = await getTags(user.id);
  return <TagsClient tags={tags} />;
}
