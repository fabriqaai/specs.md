"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api";
import type { TaskFilters } from "../types";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
};

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters ?? {}),
    queryFn: () => fetchTasks(filters),
  });
}
