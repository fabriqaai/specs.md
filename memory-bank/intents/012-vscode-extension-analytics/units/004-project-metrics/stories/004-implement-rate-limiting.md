---
story: 004-implement-rate-limiting
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
priority: could
status: complete
created: 2025-01-08T12:45:00.000Z
implemented: true
---

# Story: Implement Rate Limiting

## User Story

**As a** specsmd maintainer
**I want** project metrics to be rate-limited
**So that** heavy refactoring sessions don't overwhelm analytics

## Acceptance Criteria

- [ ] Maximum 5 project_changed events per minute
- [ ] Rate limit uses sliding window (not fixed buckets)
- [ ] Events beyond limit are silently dropped
- [ ] Rate limit resets as old events age out of window
- [ ] Rate limit is per-session (not persistent)

## Technical Notes

```typescript
class ProjectMetricsTracker {
  private emitTimestamps: number[] = [];

  private isRateLimited(): boolean {
    const oneMinuteAgo = Date.now() - 60000;

    // Clean up old timestamps
    this.emitTimestamps = this.emitTimestamps.filter(t => t > oneMinuteAgo);

    // Check if at limit
    return this.emitTimestamps.length >= 5;
  }

  private checkAndEmit(counts: ProjectCounts): void {
    // Check rate limit
    if (this.isRateLimited()) {
      return; // Silently drop
    }

    // Check if actually changed
    if (!this.hasChanged(counts)) {
      return;
    }

    // Emit event
    analytics.trackProjectChanged({ ... });
    this.emitTimestamps.push(Date.now());
    this.lastSnapshot = counts;
  }
}
```

## Estimate

**Size**: S
