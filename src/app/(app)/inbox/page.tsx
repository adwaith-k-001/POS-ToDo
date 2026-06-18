import { TaskList } from "@/components/tasks/TaskList";

export default function InboxPage() {
  return (
    <TaskList
      title="Inbox"
      description="Unorganized tasks — capture first, categorize later."
      defaultFilters={{ inbox: true }}
      emptyMessage="Inbox is empty. Add ideas and tasks here."
    />
  );
}
