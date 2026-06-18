export const dynamic = "force-dynamic";
import { getTags } from "@/services/tag.service";
import { TagsClient } from "./TagsClient";

export default async function TagsPage() {
  const tags = await getTags();
  return <TagsClient tags={tags} />;
}
