import { TaskList } from "@/components/tasks/TaskList";

export default function UpcomingPage() {
  return (
    <TaskList
      title="Upcoming"
      description="Tasks with upcoming deadlines."
      defaultFilters={{ status: ["TODO", "IN_PROGRESS"] }}
      emptyMessage="No upcoming tasks with deadlines."
    />
  );
}
