import { ClipboardList } from "lucide-react";

export function TaskEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No tasks yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Create your first task to get started tracking your work.
      </p>
    </div>
  );
}
