"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TaskStatus } from "../types";

export type FilterValue = TaskStatus | "ALL";

interface TaskFiltersProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

const filters: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

export function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as FilterValue)}>
      <TabsList className="grid w-full grid-cols-4">
        {filters.map((filter) => (
          <TabsTrigger key={filter.value} value={filter.value}>
            {filter.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
