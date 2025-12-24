import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedFilter, FilterState, ApiError } from "../types";

interface SavedFiltersResponse {
  data: SavedFilter[];
}

interface SavedFilterResponse {
  data: SavedFilter;
}

async function fetchSavedFilters(): Promise<SavedFilter[]> {
  const response = await fetch("/api/saved-filters");

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }

  const result: SavedFiltersResponse = await response.json();
  return result.data;
}

async function createSavedFilter(input: {
  name: string;
  filters: FilterState;
}): Promise<SavedFilter> {
  const response = await fetch("/api/saved-filters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }

  const result: SavedFilterResponse = await response.json();
  return result.data;
}

async function deleteSavedFilter(id: string): Promise<void> {
  const response = await fetch(`/api/saved-filters/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error.message);
  }
}

export function useSavedFilters() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["savedFilters"],
    queryFn: fetchSavedFilters,
  });

  const createMutation = useMutation({
    mutationFn: createSavedFilter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedFilter,
    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["savedFilters"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<SavedFilter[]>(["savedFilters"]);

      // Optimistically update
      queryClient.setQueryData<SavedFilter[]>(["savedFilters"], (old) =>
        old?.filter((f) => f.id !== id) ?? []
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["savedFilters"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["savedFilters"] });
    },
  });

  return {
    savedFilters: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createFilter: createMutation.mutateAsync,
    deleteFilter: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
