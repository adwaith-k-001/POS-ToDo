import { notFound } from "next/navigation";
import { getTagById } from "@/services/tag.service";
import { TaskList } from "@/components/tasks/TaskList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tag = await getTagById(id);
  if (!tag) notFound();

  return (
    <div className="space-y-6">
      <Link href="/tags" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Tags
      </Link>
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }} />
        <h1 className="text-xl font-semibold text-slate-100">{tag.name}</h1>
        <span className="text-sm text-slate-500">({tag._count.tasks} tasks)</span>
      </div>
      <TaskList
        title="Tasks"
        defaultFilters={{ tagId: id }}
        emptyMessage={`No tasks tagged with "${tag.name}".`}
      />
    </div>
  );
}
