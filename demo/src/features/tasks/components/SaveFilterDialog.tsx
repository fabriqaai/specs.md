"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSavedFilters } from "../hooks/useSavedFilters";
import type { FilterState } from "../types";
import { getPresetLabel } from "../lib/filterUtils";

interface SaveFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: FilterState;
}

export function SaveFilterDialog({
  open,
  onOpenChange,
  currentFilters,
}: SaveFilterDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { createFilter, isCreating } = useSavedFilters();

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or less");
      return;
    }

    try {
      await createFilter({ name: trimmedName, filters: currentFilters });
      setName("");
      setError(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save filter");
    }
  };

  const handleClose = () => {
    setName("");
    setError(null);
    onOpenChange(false);
  };

  // Format current filters for display
  const filterSummary = [];
  if (currentFilters.search) {
    filterSummary.push(`Search: "${currentFilters.search}"`);
  }
  if (currentFilters.status && currentFilters.status !== "ALL") {
    filterSummary.push(`Status: ${currentFilters.status.replace("_", " ")}`);
  }
  if (currentFilters.priority && currentFilters.priority !== "ALL") {
    filterSummary.push(`Priority: ${currentFilters.priority}`);
  }
  if (currentFilters.dateRange) {
    if (currentFilters.dateRange.type === "preset") {
      filterSummary.push(`Date: ${getPresetLabel(currentFilters.dateRange.preset)}`);
    } else {
      filterSummary.push(`Date: ${currentFilters.dateRange.startDate} to ${currentFilters.dateRange.endDate}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Filter</DialogTitle>
          <DialogDescription>
            Save your current filter configuration for quick access later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filter-name">Name</Label>
            <Input
              id="filter-name"
              placeholder="e.g., High Priority This Week"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={50}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {filterSummary.length > 0 && (
            <div className="space-y-2">
              <Label>Current filters</Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                {filterSummary.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-muted-foreground/60">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating}>
            {isCreating ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
