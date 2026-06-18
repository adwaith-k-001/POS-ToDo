import { TaskList } from "@/components/tasks/TaskList";

export default function TodayPage() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <TaskList
      title="Today"
      description="Tasks due today."
      defaultFilters={{
        status: ["TODO", "IN_PROGRESS"],
      }}
      showFilters={false}
      emptyMessage="Nothing due today. Enjoy your day!"
    />
  );
}
