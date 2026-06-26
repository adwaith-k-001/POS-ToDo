import { notFound, redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getTaskById } from "@/services/task.service";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const task = await getTaskById(user.id, id);
  if (!task) notFound();
  return <TaskDetailClient task={task} />;
}
