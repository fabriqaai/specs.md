"use client";

import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task } from "../types";
import { cn } from "@/lib/utils";
import { TaskEditForm } from "./TaskEditForm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { HighlightedText } from "./HighlightedText";

interface TaskCardProps {
  task: Task;
  searchTerm?: string;
}

const priorityConfig = {
  HIGH: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100", label: "High" },
  MEDIUM: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100", label: "Medium" },
  LOW: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100", label: "Low" },
};

const statusConfig = {
  TODO: { color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100", label: "To Do" },
  IN_PROGRESS: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", label: "In Progress" },
  DONE: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", label: "Done" },
};

export function TaskCard({ task, searchTerm }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && task.status !== "DONE" && isPast(dueDate) && !isToday(dueDate);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                <HighlightedText text={task.title} highlight={searchTerm ?? ""} />
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  <HighlightedText text={task.description} highlight={searchTerm ?? ""} />
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-1">
                <Badge className={cn("text-xs", priority.color)}>
                  {priority.label}
                </Badge>
                <Badge className={cn("text-xs", status.color)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsEditOpen(true)}
                  aria-label="Edit task"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => setIsDeleteOpen(true)}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {dueDate && (
            <div className="mt-3 pt-3 border-t">
              <span
                className={cn(
                  "text-sm",
                  isOverdue
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {isOverdue ? "Overdue: " : "Due: "}
                {format(dueDate, "MMM d, yyyy")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditOpen && (
        <TaskEditForm
          task={task}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

      <DeleteConfirmDialog
        task={task}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
