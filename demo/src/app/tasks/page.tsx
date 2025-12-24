import { TaskList } from "@/features/tasks/components/TaskList";
import { TaskForm } from "@/features/tasks/components/TaskForm";

export default function TasksPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Tasks</h1>
          <p className="text-muted-foreground">
            Create, track, and manage your tasks.
          </p>
        </header>

        <div className="space-y-6">
          <TaskForm />
          <TaskList />
        </div>
      </div>
    </main>
  );
}
