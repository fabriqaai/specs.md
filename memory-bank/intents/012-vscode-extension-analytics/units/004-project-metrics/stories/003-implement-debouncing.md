---
story: 003-implement-debouncing
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
priority: could
status: complete
created: 2025-01-08T12:45:00.000Z
implemented: true
---

# Story: Implement Debouncing for File Changes

## User Story

**As a** developer using specsmd
**I want** analytics to debounce file watcher events
**So that** rapid file saves don't spam analytics

## Acceptance Criteria

- [ ] File change events debounced with 5 second window
- [ ] Timer resets on each new file change
- [ ] Only fires after 5 seconds of quiet
- [ ] Previous timer cancelled when new change arrives
- [ ] No memory leaks from timer handling

## Technical Notes

```typescript
class ProjectMetricsTracker {
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastSnapshot: ProjectCounts | null = null;

  onScanComplete(counts: ProjectCounts): void {
    // Clear any existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.checkAndEmit(counts);
      this.debounceTimer = null;
    }, 5000);
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
```

## Estimate

**Size**: S
