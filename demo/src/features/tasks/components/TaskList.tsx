"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useFilterState } from "../hooks/useFilterState";
import { TaskCard } from "./TaskCard";
import { TaskEmptyState } from "./TaskEmptyState";
import { TaskListSkeleton } from "./TaskListSkeleton";
import { TaskFilters } from "./TaskFilters";
import { SearchInput } from "./SearchInput";
import { DateRangeFilter } from "./DateRangeFilter";
import { PriorityFilter } from "./PriorityFilter";
import { SavedFiltersMenu } from "./SavedFiltersMenu";
import { SaveFilterDialog } from "./SaveFilterDialog";
import { applyFilters } from "../lib/filterUtils";
import { Button } from "@/components/ui/button";
import type { Task, TaskFilters as TaskFiltersType, FilterState } from "../types";

interface TaskListProps {
  initialTasks?: Task[];
  filters?: TaskFiltersType;
}

export function TaskList({ initialTasks, filters }: TaskListProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const {
    filters: filterState,
    setSearch,
    setStatus,
    setPriority,
    setDateRange,
    setFilters,
    clearFilters,
    activeFilterCount,
  } = useFilterState();

  const handleApplySavedFilter = (savedFilters: FilterState) => {
    setFilters(savedFilters);
  };

  const { data: tasks, isLoading, error } = useTasks(filters);

  // Apply all filters client-side
  const filteredTasks = useMemo(() => {
    const allTasks = tasks ?? initialTasks ?? [];
    return applyFilters(allTasks, filterState);
  }, [tasks, initialTasks, filterState]);

  if (isLoading && !initialTasks) {
    return <TaskListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <p className="font-medium">Error loading tasks</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const displayTasks = tasks ?? initialTasks ?? [];

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <SearchInput
        value={filterState.search ?? ""}
        onChange={setSearch}
        placeholder="Search tasks..."
      />

      {/* Filter Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TaskFilters
          value={filterState.status ?? "ALL"}
          onChange={setStatus}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityFilter
            value={filterState.priority ?? "ALL"}
            onChange={setPriority}
          />
          <DateRangeFilter
            value={filterState.dateRange}
            onChange={setDateRange}
          />
          <SavedFiltersMenu onApply={handleApplySavedFilter} />
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Results Count & Clear All */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} found
            {` (${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active)`}
          </p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Task List */}
      {displayTasks.length === 0 ? (
        <TaskEmptyState />
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-lg border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">
            No tasks match your search
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} searchTerm={filterState.search} />
          ))}
        </div>
      )}

      <SaveFilterDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        currentFilters={filterState}
      />
    </div>
  );
}
