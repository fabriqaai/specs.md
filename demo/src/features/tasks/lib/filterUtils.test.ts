import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  filterBySearch,
  filterByDateRange,
  applyFilters,
  getActiveFilterCount,
  getPresetLabel,
  escapeRegex,
} from "./filterUtils";
import type { Task } from "../types";

// Mock date-fns to control "today"
vi.mock("date-fns", async () => {
  const actual = await vi.importActual("date-fns");
  return {
    ...actual,
    // We'll use the actual functions but control the current date in tests
  };
});

// Helper to create mock tasks
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    title: "Test Task",
    description: null,
    status: "TODO",
    priority: "MEDIUM",
    dueDate: null,
    userId: "user-1",
    createdAt: "2025-12-01T00:00:00.000Z",
    updatedAt: "2025-12-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterUtils", () => {
  describe("filterBySearch", () => {
    const tasks: Task[] = [
      createTask({ id: "1", title: "Buy groceries", description: "Milk, bread, eggs" }),
      createTask({ id: "2", title: "Project meeting", description: "Discuss roadmap" }),
      createTask({ id: "3", title: "Read book", description: null }),
      createTask({ id: "4", title: "Call mom", description: "Birthday planning" }),
    ];

    it("should return all tasks when search is empty", () => {
      expect(filterBySearch(tasks, "")).toEqual(tasks);
      expect(filterBySearch(tasks, "   ")).toEqual(tasks);
    });

    it("should filter by title (case-insensitive)", () => {
      const result = filterBySearch(tasks, "project");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    it("should filter by description (case-insensitive)", () => {
      const result = filterBySearch(tasks, "birthday");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });

    it("should match partial strings", () => {
      const result = filterBySearch(tasks, "book");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("should return empty array when no matches", () => {
      const result = filterBySearch(tasks, "xyz123nonexistent");
      expect(result).toHaveLength(0);
    });

    it("should handle tasks with null descriptions", () => {
      // "book" only appears in title of task 3 (which has null description)
      const result = filterBySearch(tasks, "book");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("should be case-insensitive for both title and description", () => {
      expect(filterBySearch(tasks, "PROJECT")).toHaveLength(1);
      expect(filterBySearch(tasks, "MILK")).toHaveLength(1);
    });
  });

  describe("filterByDateRange", () => {
    // Using fixed dates relative to 2025-12-07 as "today"
    const today = "2025-12-07T12:00:00.000Z";
    const yesterday = "2025-12-06T12:00:00.000Z";
    const tomorrow = "2025-12-08T12:00:00.000Z";
    const nextWeek = "2025-12-14T12:00:00.000Z";
    const lastMonth = "2025-11-15T12:00:00.000Z";

    const tasks: Task[] = [
      createTask({ id: "1", title: "Today task", dueDate: today }),
      createTask({ id: "2", title: "Yesterday task", dueDate: yesterday, status: "TODO" }),
      createTask({ id: "3", title: "Tomorrow task", dueDate: tomorrow }),
      createTask({ id: "4", title: "Next week task", dueDate: nextWeek }),
      createTask({ id: "5", title: "No due date", dueDate: null }),
      createTask({ id: "6", title: "Last month overdue", dueDate: lastMonth, status: "TODO" }),
      createTask({ id: "7", title: "Yesterday done", dueDate: yesterday, status: "DONE" }),
    ];

    beforeEach(() => {
      // Mock current date to 2025-12-07
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-12-07T12:00:00.000Z"));
    });

    it("should filter by 'today' preset", () => {
      const result = filterByDateRange(tasks, { type: "preset", preset: "today" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should filter by 'no_due_date' preset", () => {
      const result = filterByDateRange(tasks, { type: "preset", preset: "no_due_date" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("5");
    });

    it("should filter by 'overdue' preset (excludes DONE tasks)", () => {
      const result = filterByDateRange(tasks, { type: "preset", preset: "overdue" });
      // Should include yesterday task (TODO) and last month task (TODO)
      // Should NOT include yesterday done task
      expect(result.some((t) => t.id === "2")).toBe(true);
      expect(result.some((t) => t.id === "6")).toBe(true);
      expect(result.some((t) => t.id === "7")).toBe(false);
    });

    it("should filter by 'this_week' preset", () => {
      const result = filterByDateRange(tasks, { type: "preset", preset: "this_week" });
      // Dec 7, 2025 is a Sunday. Week (Mon-Sun) is Dec 1-7
      // Today (Dec 7) and Yesterday (Dec 6) are in this week
      // Tomorrow (Dec 8) is Monday of NEXT week
      expect(result.some((t) => t.id === "1")).toBe(true); // today (Dec 7 Sun)
      expect(result.some((t) => t.id === "2")).toBe(true); // yesterday (Dec 6 Sat)
      expect(result.some((t) => t.id === "3")).toBe(false); // tomorrow (Dec 8 Mon - next week)
      expect(result.some((t) => t.id === "4")).toBe(false); // next week (Dec 14)
    });

    it("should filter by 'this_month' preset", () => {
      const result = filterByDateRange(tasks, { type: "preset", preset: "this_month" });
      // December 2025 tasks
      expect(result.some((t) => t.id === "1")).toBe(true); // today
      expect(result.some((t) => t.id === "4")).toBe(true); // next week (still Dec)
      expect(result.some((t) => t.id === "6")).toBe(false); // last month (Nov)
    });

    it("should filter by custom date range (inclusive)", () => {
      const result = filterByDateRange(tasks, {
        type: "custom",
        startDate: "2025-12-06",
        endDate: "2025-12-08",
      });
      // Should include yesterday, today, tomorrow
      expect(result).toHaveLength(4); // 2 yesterday tasks + today + tomorrow
      expect(result.some((t) => t.id === "1")).toBe(true);
      expect(result.some((t) => t.id === "2")).toBe(true);
      expect(result.some((t) => t.id === "3")).toBe(true);
    });

    it("should exclude tasks without due date in custom range", () => {
      const result = filterByDateRange(tasks, {
        type: "custom",
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      });
      expect(result.some((t) => t.id === "5")).toBe(false); // no due date
    });
  });

  describe("applyFilters", () => {
    const tasks: Task[] = [
      createTask({ id: "1", title: "Buy groceries", status: "TODO", dueDate: "2025-12-07T12:00:00.000Z" }),
      createTask({ id: "2", title: "Project meeting", status: "IN_PROGRESS", dueDate: "2025-12-07T12:00:00.000Z" }),
      createTask({ id: "3", title: "Read book", status: "DONE", dueDate: null }),
      createTask({ id: "4", title: "Call about project", status: "TODO", dueDate: "2025-12-08T12:00:00.000Z" }),
    ];

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-12-07T12:00:00.000Z"));
    });

    it("should return all tasks with empty filters", () => {
      const result = applyFilters(tasks, {});
      expect(result).toEqual(tasks);
    });

    it("should apply search filter only", () => {
      const result = applyFilters(tasks, { search: "project" });
      expect(result).toHaveLength(2);
      expect(result.some((t) => t.id === "2")).toBe(true);
      expect(result.some((t) => t.id === "4")).toBe(true);
    });

    it("should apply status filter only", () => {
      const result = applyFilters(tasks, { status: "TODO" });
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.status === "TODO")).toBe(true);
    });

    it("should return all tasks when status is ALL", () => {
      const result = applyFilters(tasks, { status: "ALL" });
      expect(result).toEqual(tasks);
    });

    it("should apply date range filter only", () => {
      const result = applyFilters(tasks, {
        dateRange: { type: "preset", preset: "today" },
      });
      expect(result).toHaveLength(2);
      expect(result.some((t) => t.id === "1")).toBe(true);
      expect(result.some((t) => t.id === "2")).toBe(true);
    });

    it("should apply multiple filters with AND logic", () => {
      const result = applyFilters(tasks, {
        search: "project",
        status: "TODO",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });

    it("should apply all three filters with AND logic", () => {
      const result = applyFilters(tasks, {
        search: "groceries",
        status: "TODO",
        dateRange: { type: "preset", preset: "today" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("getActiveFilterCount", () => {
    it("should return 0 for empty filters", () => {
      expect(getActiveFilterCount({})).toBe(0);
    });

    it("should return 0 for status ALL", () => {
      expect(getActiveFilterCount({ status: "ALL" })).toBe(0);
    });

    it("should count search as active filter", () => {
      expect(getActiveFilterCount({ search: "test" })).toBe(1);
    });

    it("should not count empty search", () => {
      expect(getActiveFilterCount({ search: "" })).toBe(0);
      expect(getActiveFilterCount({ search: "   " })).toBe(0);
    });

    it("should count status as active filter", () => {
      expect(getActiveFilterCount({ status: "TODO" })).toBe(1);
    });

    it("should count date range as active filter", () => {
      expect(getActiveFilterCount({ dateRange: { type: "preset", preset: "today" } })).toBe(1);
    });

    it("should count all active filters", () => {
      expect(
        getActiveFilterCount({
          search: "test",
          status: "TODO",
          dateRange: { type: "preset", preset: "today" },
        })
      ).toBe(3);
    });
  });

  describe("getPresetLabel", () => {
    it("should return correct labels for all presets", () => {
      expect(getPresetLabel("today")).toBe("Today");
      expect(getPresetLabel("this_week")).toBe("This Week");
      expect(getPresetLabel("this_month")).toBe("This Month");
      expect(getPresetLabel("overdue")).toBe("Overdue");
      expect(getPresetLabel("no_due_date")).toBe("No Due Date");
    });
  });

  describe("escapeRegex", () => {
    it("should escape special regex characters", () => {
      expect(escapeRegex("$100")).toBe("\\$100");
      expect(escapeRegex("file.txt")).toBe("file\\.txt");
      expect(escapeRegex("(test)")).toBe("\\(test\\)");
      expect(escapeRegex("[a-z]")).toBe("\\[a-z\\]");
      expect(escapeRegex("a+b*c?")).toBe("a\\+b\\*c\\?");
      expect(escapeRegex("a^b$c")).toBe("a\\^b\\$c");
      expect(escapeRegex("{1,2}")).toBe("\\{1,2\\}");
      expect(escapeRegex("a|b")).toBe("a\\|b");
      expect(escapeRegex("path\\file")).toBe("path\\\\file");
    });

    it("should return plain text unchanged", () => {
      expect(escapeRegex("hello world")).toBe("hello world");
      expect(escapeRegex("task123")).toBe("task123");
    });
  });

  describe("applyFilters with priority", () => {
    const tasks: Task[] = [
      createTask({ id: "1", title: "Task 1", priority: "HIGH", status: "TODO" }),
      createTask({ id: "2", title: "Task 2", priority: "MEDIUM", status: "TODO" }),
      createTask({ id: "3", title: "Task 3", priority: "LOW", status: "TODO" }),
      createTask({ id: "4", title: "Task 4", priority: "HIGH", status: "DONE" }),
    ];

    it("should filter by priority only", () => {
      const result = applyFilters(tasks, { priority: "HIGH" });
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.priority === "HIGH")).toBe(true);
    });

    it("should return all tasks when priority is ALL", () => {
      const result = applyFilters(tasks, { priority: "ALL" });
      expect(result).toEqual(tasks);
    });

    it("should combine priority with status filter", () => {
      const result = applyFilters(tasks, { priority: "HIGH", status: "TODO" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should combine priority with search", () => {
      const tasksWithSearch: Task[] = [
        createTask({ id: "1", title: "Important project", priority: "HIGH" }),
        createTask({ id: "2", title: "Regular project", priority: "MEDIUM" }),
        createTask({ id: "3", title: "Important task", priority: "LOW" }),
      ];
      const result = applyFilters(tasksWithSearch, { search: "important", priority: "HIGH" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("getActiveFilterCount with priority", () => {
    it("should count priority as active filter", () => {
      expect(getActiveFilterCount({ priority: "HIGH" })).toBe(1);
    });

    it("should return 0 for priority ALL", () => {
      expect(getActiveFilterCount({ priority: "ALL" })).toBe(0);
    });

    it("should count all four filter types", () => {
      expect(
        getActiveFilterCount({
          search: "test",
          status: "TODO",
          priority: "HIGH",
          dateRange: { type: "preset", preset: "today" },
        })
      ).toBe(4);
    });
  });
});
