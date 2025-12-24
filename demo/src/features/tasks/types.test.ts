import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  CreateTaskFormSchema,
  UpdateTaskSchema,
  TaskFiltersSchema,
  DateRangeFilterSchema,
  FilterStateSchema,
  SavedFilterInputSchema,
} from "./types";

describe("Task Validation Schemas", () => {
  describe("CreateTaskSchema", () => {
    it("should validate a valid task with required fields only", () => {
      const input = { title: "Test Task" };
      const result = CreateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Task");
        expect(result.data.priority).toBe("MEDIUM"); // default
      }
    });

    it("should validate a task with all fields", () => {
      const input = {
        title: "Complete Task",
        description: "This is a detailed description",
        priority: "HIGH",
        dueDate: "2025-12-31T23:59:59.000Z",
      };
      const result = CreateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Complete Task");
        expect(result.data.description).toBe("This is a detailed description");
        expect(result.data.priority).toBe("HIGH");
        expect(result.data.dueDate).toBe("2025-12-31T23:59:59.000Z");
      }
    });

    it("should reject empty title", () => {
      const input = { title: "" };
      const result = CreateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject title that is too long", () => {
      const input = { title: "a".repeat(201) };
      const result = CreateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const input = { title: "Test", priority: "CRITICAL" };
      const result = CreateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should accept valid priorities", () => {
      const priorities = ["HIGH", "MEDIUM", "LOW"];

      for (const priority of priorities) {
        const result = CreateTaskSchema.safeParse({ title: "Test", priority });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("CreateTaskFormSchema", () => {
    it("should transform YYYY-MM-DD date to ISO datetime", () => {
      const result = CreateTaskFormSchema.safeParse({
        title: "Test Task",
        dueDate: "2025-12-15",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        expect(result.data.dueDate).toContain("2025-12-15");
      }
    });

    it("should transform empty string dueDate to null", () => {
      const result = CreateTaskFormSchema.safeParse({
        title: "Test Task",
        dueDate: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBeNull();
      }
    });

    it("should keep null dueDate as null", () => {
      const result = CreateTaskFormSchema.safeParse({
        title: "Test Task",
        dueDate: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBeNull();
      }
    });

    it("should work without dueDate", () => {
      const result = CreateTaskFormSchema.safeParse({
        title: "Test Task",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("TaskFiltersSchema", () => {
    it("should validate valid status filters", () => {
      const statuses = ["TODO", "IN_PROGRESS", "DONE"];

      for (const status of statuses) {
        const result = TaskFiltersSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = TaskFiltersSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should allow empty filters", () => {
      const result = TaskFiltersSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateTaskSchema", () => {
    it("should validate partial updates with title only", () => {
      const input = { title: "Updated Title" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Title");
      }
    });

    it("should validate partial updates with status only", () => {
      const input = { status: "IN_PROGRESS" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("IN_PROGRESS");
      }
    });

    it("should validate partial updates with priority only", () => {
      const input = { priority: "HIGH" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("HIGH");
      }
    });

    it("should validate full update with all fields", () => {
      const input = {
        title: "Updated Task",
        description: "New description",
        status: "DONE",
        priority: "LOW",
        dueDate: "2025-12-31T23:59:59.000Z",
      };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Task");
        expect(result.data.description).toBe("New description");
        expect(result.data.status).toBe("DONE");
        expect(result.data.priority).toBe("LOW");
        expect(result.data.dueDate).toBe("2025-12-31T23:59:59.000Z");
      }
    });

    it("should allow clearing description with null", () => {
      const input = { description: null };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeNull();
      }
    });

    it("should allow clearing dueDate with null", () => {
      const input = { dueDate: null };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBeNull();
      }
    });

    it("should reject empty title when provided", () => {
      const input = { title: "" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject title that is too long", () => {
      const input = { title: "a".repeat(201) };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const input = { status: "INVALID" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should reject invalid priority", () => {
      const input = { priority: "URGENT" };
      const result = UpdateTaskSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it("should validate all valid statuses", () => {
      const statuses = ["TODO", "IN_PROGRESS", "DONE"];

      for (const status of statuses) {
        const result = UpdateTaskSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should allow empty update object", () => {
      const result = UpdateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe("Filter Schemas", () => {
  describe("DateRangeFilterSchema", () => {
    it("should accept preset date ranges", () => {
      const result = DateRangeFilterSchema.safeParse({
        type: "preset",
        preset: "today",
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.type === "preset") {
        expect(result.data.preset).toBe("today");
      }
    });

    it("should accept all valid presets", () => {
      const presets = ["today", "this_week", "this_month", "overdue", "no_due_date"];
      for (const preset of presets) {
        const result = DateRangeFilterSchema.safeParse({ type: "preset", preset });
        expect(result.success).toBe(true);
      }
    });

    it("should accept custom date ranges", () => {
      const result = DateRangeFilterSchema.safeParse({
        type: "custom",
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      });
      expect(result.success).toBe(true);
      if (result.success && result.data.type === "custom") {
        expect(result.data.startDate).toBe("2025-12-01");
        expect(result.data.endDate).toBe("2025-12-31");
      }
    });

    it("should reject invalid preset", () => {
      const result = DateRangeFilterSchema.safeParse({
        type: "preset",
        preset: "invalid_preset",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("FilterStateSchema", () => {
    it("should accept empty filter state", () => {
      const result = FilterStateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept complete filter state", () => {
      const result = FilterStateSchema.safeParse({
        search: "test",
        status: "TODO",
        priority: "HIGH",
        dateRange: { type: "preset", preset: "today" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("test");
        expect(result.data.status).toBe("TODO");
        expect(result.data.priority).toBe("HIGH");
      }
    });

    it("should accept ALL for status and priority", () => {
      const result = FilterStateSchema.safeParse({
        status: "ALL",
        priority: "ALL",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("ALL");
        expect(result.data.priority).toBe("ALL");
      }
    });
  });

  describe("SavedFilterInputSchema", () => {
    it("should accept valid saved filter input", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "My Filter",
        filters: { status: "TODO" },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Filter");
      }
    });

    it("should trim whitespace from name", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "  My Filter  ",
        filters: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("My Filter");
      }
    });

    it("should reject empty name", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "",
        filters: {},
      });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only name", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "   ",
        filters: {},
      });
      expect(result.success).toBe(false);
    });

    it("should reject name over 50 characters", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "a".repeat(51),
        filters: {},
      });
      expect(result.success).toBe(false);
    });

    it("should accept name exactly 50 characters", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "a".repeat(50),
        filters: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name.length).toBe(50);
      }
    });

    it("should require filters object", () => {
      const result = SavedFilterInputSchema.safeParse({ name: "Test" });
      expect(result.success).toBe(false);
    });

    it("should accept complex filter state", () => {
      const result = SavedFilterInputSchema.safeParse({
        name: "High Priority This Week",
        filters: {
          search: "project",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dateRange: { type: "preset", preset: "this_week" },
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filters.priority).toBe("HIGH");
      }
    });
  });
});
