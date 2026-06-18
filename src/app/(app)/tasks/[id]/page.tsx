import { notFound } from "next/navigation";
import { getTaskById } from "@/services/task.service";
import { TaskDetailClient } from "./TaskDetailClient";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();
  return <TaskDetailClient task={task} />;
}
