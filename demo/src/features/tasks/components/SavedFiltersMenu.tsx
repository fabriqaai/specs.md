"use client";

import { useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSavedFilters } from "../hooks/useSavedFilters";
import type { FilterState, SavedFilter } from "../types";

interface SavedFiltersMenuProps {
  onApply: (filters: FilterState) => void;
}

export function SavedFiltersMenu({ onApply }: SavedFiltersMenuProps) {
  const { savedFilters, isLoading, deleteFilter, isDeleting } = useSavedFilters();
  const [deleteTarget, setDeleteTarget] = useState<SavedFilter | null>(null);

  const handleSelect = (filterId: string) => {
    const filter = savedFilters.find((f) => f.id === filterId);
    if (filter) {
      onApply(filter.filters);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, filter: SavedFilter) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(filter);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteFilter(deleteTarget.id);
      } catch {
        // Error is handled by the hook
      }
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Bookmark className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-auto min-w-[140px]" aria-label="Saved filters">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
            {savedFilters.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {savedFilters.length}
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No saved filters yet
            </div>
          ) : (
            <SelectGroup>
              <SelectLabel>My Filters</SelectLabel>
              {savedFilters.map((filter) => (
                <SelectItem
                  key={filter.id}
                  value={filter.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className="truncate">{filter.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, filter)}
                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete ${filter.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Filter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
