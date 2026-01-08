---
stage: plan
bolt: bolt-vscode-analytics-metrics-1
created: 2026-01-09T10:00:00Z
---

## Implementation Plan: Project Metrics Events

### Objective

Create a ProjectMetricsTracker class that captures project structure snapshots and delta changes with built-in debouncing and rate limiting to prevent event spam from file watcher activity.

### Deliverables

- `vs-code-extension/src/analytics/projectMetricsEvents.ts` - Main module with:
  - `ProjectMetricsTracker` class with stateful tracking
  - `trackProjectSnapshot()` function for initial activation capture
  - `trackProjectChanged()` function for delta-based changes
  - Event type definitions and property interfaces
- Updates to `vs-code-extension/src/analytics/index.ts` to export new functions
- Updates to `vs-code-extension/src/analytics/types.ts` for new types
- Integration hooks in extension.ts and webviewProvider.ts

### Dependencies

- **bolt-vscode-analytics-core-1**: Uses tracker.track() method (already complete)
- **scanMemoryBank()**: Existing parser provides MemoryBankModel with counts
- **FileWatcher**: Already fires refresh events we can hook into

### Technical Approach

1. **ProjectMetricsTracker Class**
   - Singleton pattern matching existing analytics modules
   - Stateful: stores lastSnapshot and emitTimestamps for comparison
   - Exposes init() for activation snapshot, onScanComplete() for file watcher
   - dispose() method for timer cleanup

2. **Snapshot Event** (`project_snapshot`)
   - Fires once per activation for specsmd projects
   - Captures entity counts from MemoryBankModel
   - Computes bolt status breakdown and aggregates
   - No project names or paths (privacy)

3. **Change Event** (`project_changed`)
   - Fires only when entity counts differ from last snapshot
   - Detects change_type: bolt_added, bolt_completed, intent_added, story_added, entities_removed
   - Includes deltas (e.g., bolts_delta: +1) and new totals
   - Subject to debouncing and rate limiting

4. **Debouncing**
   - 5-second window after file changes settle
   - Timer resets on each new scan complete
   - Prevents rapid-fire events during bulk operations

5. **Rate Limiting**
   - Maximum 5 project_changed events per minute
   - Sliding window (not fixed buckets)
   - Events beyond limit silently dropped
   - Per-session (resets when extension restarts)

### Acceptance Criteria

- [ ] `project_snapshot` event fires once per activation for specsmd projects
- [ ] Snapshot includes: intent_count, unit_count, story_count, bolt_count
- [ ] Snapshot includes bolt breakdown: active_bolts, queued_bolts, completed_bolts, blocked_bolts
- [ ] Snapshot includes aggregates: avg_units_per_intent, avg_stories_per_unit
- [ ] `project_changed` only fires when counts actually differ
- [ ] Change event includes change_type, deltas, and new totals
- [ ] Debouncing: 5-second quiet window before emit
- [ ] Rate limiting: max 5 events per minute via sliding window
- [ ] Timer resets on each new file change (debounce)
- [ ] No memory leaks from timer handling (dispose cleanup)
- [ ] All tests pass under simulated load

### Event Schemas

**project_snapshot**
```typescript
interface ProjectSnapshotEventProperties {
  intent_count: number;
  unit_count: number;
  story_count: number;
  bolt_count: number;
  active_bolts: number;
  queued_bolts: number;
  completed_bolts: number;
  blocked_bolts: number;
  avg_units_per_intent: number;
  avg_stories_per_unit: number;
}
```

**project_changed**
```typescript
type ProjectChangeType =
  | 'bolt_added'
  | 'bolt_completed'
  | 'intent_added'
  | 'story_added'
  | 'entities_removed';

interface ProjectChangedEventProperties {
  change_type: ProjectChangeType;
  // Deltas (only non-zero included)
  intents_delta?: number;
  units_delta?: number;
  stories_delta?: number;
  bolts_delta?: number;
  active_bolts_delta?: number;
  completed_bolts_delta?: number;
  // New totals
  intent_count: number;
  unit_count: number;
  story_count: number;
  bolt_count: number;
}
```

### Integration Points

1. **extension.ts activate()**: After scanMemoryBank, call `projectMetricsTracker.init(model)`
2. **webviewProvider.ts refresh()**: After scanMemoryBank, call `projectMetricsTracker.onScanComplete(model)`
3. **extension.ts deactivate()**: Call `projectMetricsTracker.dispose()` for timer cleanup

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Timer leaks | dispose() method clears all timers |
| High event volume | Rate limiting caps at 5/minute |
| Rapid file saves | Debouncing with 5-second window |
| Memory usage | Sliding window only keeps ~5 timestamps |
