import type {
  Task,
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
  TasksResponse,
  TaskResponse,
} from "./types";

const API_BASE = "/api/tasks";

export async function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) {
    params.set("status", filters.status);
  }

  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch tasks");
  }

  const data: TasksResponse = await response.json();
  return data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create task");
  }

  const data: TaskResponse = await response.json();
  return data.data;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update task");
  }

  const data: TaskResponse = await response.json();
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete task");
  }
}
