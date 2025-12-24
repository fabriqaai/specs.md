"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateRangeFilter as DateRangeFilterType, DateRangePreset } from "../types";
import { getPresetLabel } from "../lib/filterUtils";

interface DateRangeFilterProps {
  value: DateRangeFilterType | undefined;
  onChange: (value: DateRangeFilterType | undefined) => void;
}

const presets: DateRangePreset[] = [
  "today",
  "this_week",
  "this_month",
  "overdue",
  "no_due_date",
];

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") {
      setShowCustom(true);
    } else if (preset === "clear") {
      onChange(undefined);
      setShowCustom(false);
      setCustomStart("");
      setCustomEnd("");
    } else {
      setShowCustom(false);
      onChange({
        type: "preset",
        preset: preset as DateRangePreset,
      });
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        type: "custom",
        startDate: customStart,
        endDate: customEnd,
      });
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setShowCustom(false);
    setCustomStart("");
    setCustomEnd("");
  };

  // Determine the current display value
  const getCurrentValue = (): string => {
    if (!value) return "";
    if (value.type === "preset") return value.preset;
    return "custom";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Select value={getCurrentValue()} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-full">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Due Date" />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {getPresetLabel(preset)}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear date filter</span>
        </Button>
      )}

      {showCustom && (
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-xs">
              From
            </Label>
            <Input
              id="start-date"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date" className="text-xs">
              To
            </Label>
            <Input
              id="end-date"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
