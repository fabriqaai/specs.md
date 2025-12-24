"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskPriority } from "../types";

interface PriorityFilterProps {
  value: TaskPriority | "ALL";
  onChange: (value: TaskPriority | "ALL") => void;
}

export function PriorityFilter({ value, onChange }: PriorityFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Priorities</SelectItem>
        <SelectItem value="HIGH">High</SelectItem>
        <SelectItem value="MEDIUM">Medium</SelectItem>
        <SelectItem value="LOW">Low</SelectItem>
      </SelectContent>
    </Select>
  );
}
