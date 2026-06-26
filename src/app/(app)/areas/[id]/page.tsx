import { notFound, redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getAreaById } from "@/services/area.service";
import { TaskList } from "@/components/tasks/TaskList";
import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";

export default async function AreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const area = await getAreaById(user.id, id);
  if (!area) notFound();

  return (
    <div className="space-y-6">
      <Link href="/areas" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Areas
      </Link>

      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${area.color}20` }}
        >
          {area.icon ?? <Layers className="h-6 w-6" style={{ color: area.color }} />}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{area.name}</h1>
          <p className="text-sm text-slate-500">{area._count.tasks} tasks total</p>
        </div>
      </div>

      <TaskList
        title="Tasks"
        defaultFilters={{ areaId: id }}
        defaultAreaId={id}
        emptyMessage={`No tasks in ${area.name} yet.`}
      />
    </div>
  );
}
