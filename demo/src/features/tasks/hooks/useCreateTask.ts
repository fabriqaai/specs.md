"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api";
import { taskKeys } from "./useTasks";
import type { CreateTaskInput, Task } from "../types";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (newTask: Task) => {
      // Invalidate all task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
