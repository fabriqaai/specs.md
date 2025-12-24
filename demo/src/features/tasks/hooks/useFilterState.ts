"use client";

import { useState, useCallback, useMemo } from "react";
import type { FilterState, DateRangeFilter, TaskStatus, TaskPriority } from "../types";
import { getActiveFilterCount } from "../lib/filterUtils";

export interface UseFilterStateReturn {
  filters: FilterState;
  setSearch: (search: string) => void;
  setStatus: (status: TaskStatus | "ALL") => void;
  setPriority: (priority: TaskPriority | "ALL") => void;
  setDateRange: (dateRange: DateRangeFilter | undefined) => void;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

const initialFilters: FilterState = {
  search: "",
  status: "ALL",
  priority: "ALL",
  dateRange: undefined,
};

export function useFilterState(
  initialState?: Partial<FilterState>
): UseFilterStateReturn {
  const [filters, setFiltersState] = useState<FilterState>({
    ...initialFilters,
    ...initialState,
  });

  const setSearch = useCallback((search: string) => {
    setFiltersState((prev) => ({ ...prev, search }));
  }, []);

  const setStatus = useCallback((status: TaskStatus | "ALL") => {
    setFiltersState((prev) => ({ ...prev, status }));
  }, []);

  const setPriority = useCallback((priority: TaskPriority | "ALL") => {
    setFiltersState((prev) => ({ ...prev, priority }));
  }, []);

  const setDateRange = useCallback((dateRange: DateRangeFilter | undefined) => {
    setFiltersState((prev) => ({ ...prev, dateRange }));
  }, []);

  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState({
      ...initialFilters,
      ...newFilters,
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  );

  return {
    filters,
    setSearch,
    setStatus,
    setPriority,
    setDateRange,
    setFilters,
    clearFilters,
    activeFilterCount,
  };
}
