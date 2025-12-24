import { z } from "zod";

// Enums
export const TaskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const TaskPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Task type
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Input schemas (API expects ISO datetime)
export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().optional(),
  priority: TaskPrioritySchema.optional().default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
});

// Schema for form input (accepts YYYY-MM-DD date format from HTML date input)
export const CreateTaskFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().optional(),
  priority: TaskPrioritySchema.optional().default("MEDIUM"),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      // Transform empty string to null, YYYY-MM-DD to ISO datetime
      if (val === "" || val === null || val === undefined) return null;
      // Convert YYYY-MM-DD to ISO datetime at start of day (UTC)
      return new Date(val).toISOString();
    }),
});

export const TaskFiltersSchema = z.object({
  status: TaskStatusSchema.optional(),
});

// Schema for form input (accepts YYYY-MM-DD date format from HTML date input)
export const UpdateTaskFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      // Transform empty string to null, keep null/undefined as is
      if (val === "" || val === null || val === undefined) return null;
      return val;
    }),
});

// Schema for API input (expects ISO datetime string)
export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type CreateTaskFormInput = z.infer<typeof CreateTaskFormSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskFormInput = z.infer<typeof UpdateTaskFormSchema>;
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;

// Date Range Filter types
export const DateRangePresetSchema = z.enum([
  "today",
  "this_week",
  "this_month",
  "overdue",
  "no_due_date",
]);

export const DateRangeFilterSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("preset"),
    preset: DateRangePresetSchema,
  }),
  z.object({
    type: z.literal("custom"),
    startDate: z.string(),
    endDate: z.string(),
  }),
]);

export const FilterStateSchema = z.object({
  search: z.string().optional(),
  status: z.union([TaskStatusSchema, z.literal("ALL")]).optional(),
  priority: z.union([TaskPrioritySchema, z.literal("ALL")]).optional(),
  dateRange: DateRangeFilterSchema.optional(),
});

export type DateRangePreset = z.infer<typeof DateRangePresetSchema>;
export type DateRangeFilter = z.infer<typeof DateRangeFilterSchema>;
export type FilterState = z.infer<typeof FilterStateSchema>;

// API Response types
export interface TasksResponse {
  data: Task[];
  meta: {
    total: number;
    timestamp: string;
  };
}

export interface TaskResponse {
  data: Task;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

// SavedFilter types
export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export const SavedFilterInputSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less")),
  filters: FilterStateSchema,
});

export type SavedFilterInput = z.infer<typeof SavedFilterInputSchema>;
