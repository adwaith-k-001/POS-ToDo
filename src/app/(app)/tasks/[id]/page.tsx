import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTaskById } from "@/services/task.service";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const task = await getTaskById(user.id, id);
  if (!task) notFound();
  return <TaskDetailClient task={task} />;
}
