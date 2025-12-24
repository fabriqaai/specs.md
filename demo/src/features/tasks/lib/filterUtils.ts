import {
  isToday,
  isThisWeek,
  isThisMonth,
  isBefore,
  startOfDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import type { Task, DateRangeFilter, DateRangePreset, FilterState } from "../types";

/**
 * Check if a task matches a date range preset
 */
function matchesPreset(task: Task, preset: DateRangePreset): boolean {
  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;

  switch (preset) {
    case "today":
      return dueDate ? isToday(dueDate) : false;
    case "this_week":
      return dueDate ? isThisWeek(dueDate, { weekStartsOn: 1 }) : false;
    case "this_month":
      return dueDate ? isThisMonth(dueDate) : false;
    case "overdue":
      return dueDate
        ? isBefore(startOfDay(dueDate), startOfDay(new Date())) && task.status !== "DONE"
        : false;
    case "no_due_date":
      return dueDate === null;
    default:
      return true;
  }
}

/**
 * Check if a task falls within a custom date range (inclusive)
 */
function matchesCustomRange(
  task: Task,
  startDate: string,
  endDate: string
): boolean {
  if (!task.dueDate) return false;

  const dueDate = startOfDay(parseISO(task.dueDate));
  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));

  return isWithinInterval(dueDate, { start, end });
}

/**
 * Filter tasks by date range
 */
export function filterByDateRange(
  tasks: Task[],
  dateRange: DateRangeFilter
): Task[] {
  return tasks.filter((task) => {
    if (dateRange.type === "preset") {
      return matchesPreset(task, dateRange.preset);
    } else {
      return matchesCustomRange(task, dateRange.startDate, dateRange.endDate);
    }
  });
}

/**
 * Filter tasks by search term (case-insensitive, matches title or description)
 */
export function filterBySearch(tasks: Task[], search: string): Task[] {
  const searchLower = search.toLowerCase().trim();
  if (!searchLower) return tasks;

  return tasks.filter((task) => {
    const titleMatch = task.title.toLowerCase().includes(searchLower);
    const descriptionMatch = task.description
      ? task.description.toLowerCase().includes(searchLower)
      : false;
    return titleMatch || descriptionMatch;
  });
}

/**
 * Apply all filters with AND logic
 */
export function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = [...tasks];

  // Apply search filter
  if (filters.search) {
    result = filterBySearch(result, filters.search);
  }

  // Apply status filter
  if (filters.status && filters.status !== "ALL") {
    result = result.filter((task) => task.status === filters.status);
  }

  // Apply priority filter
  if (filters.priority && filters.priority !== "ALL") {
    result = result.filter((task) => task.priority === filters.priority);
  }

  // Apply date range filter
  if (filters.dateRange) {
    result = filterByDateRange(result, filters.dateRange);
  }

  return result;
}

/**
 * Count the number of active (non-empty) filters
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;

  if (filters.search && filters.search.trim()) {
    count++;
  }

  if (filters.status && filters.status !== "ALL") {
    count++;
  }

  if (filters.priority && filters.priority !== "ALL") {
    count++;
  }

  if (filters.dateRange) {
    count++;
  }

  return count;
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get human-readable label for a date range preset
 */
export function getPresetLabel(preset: DateRangePreset): string {
  const labels: Record<DateRangePreset, string> = {
    today: "Today",
    this_week: "This Week",
    this_month: "This Month",
    overdue: "Overdue",
    no_due_date: "No Due Date",
  };
  return labels[preset];
}
