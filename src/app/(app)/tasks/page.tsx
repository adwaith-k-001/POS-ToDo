import { TaskList } from "@/components/tasks/TaskList";

export default function TasksPage() {
  return (
    <TaskList
      title="All Tasks"
      description="Every task across all areas."
      emptyMessage="No tasks yet. Create your first task."
    />
  );
}
