---
story: 002-track-project-changes
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
priority: could
status: complete
created: 2025-01-08T12:45:00.000Z
implemented: true
---

# Story: Track Project Changes with Deltas

## User Story

**As a** specsmd maintainer
**I want** to track meaningful changes to project structure
**So that** I can understand how projects evolve over time

## Acceptance Criteria

- [ ] `project_changed` event fires when entity counts change
- [ ] Only fires if counts actually differ from last snapshot
- [ ] Includes `change_type`: bolt_added, bolt_completed, intent_added, story_added, entities_removed
- [ ] Includes deltas: bolts_delta, active_bolts_delta, etc.
- [ ] Includes new totals alongside deltas
- [ ] Does not fire for content-only changes (edits without count changes)

## Technical Notes

```typescript
interface ProjectChangedEvent {
  change_type: 'bolt_added' | 'bolt_completed' | 'intent_added' | 'story_added' | 'entities_removed';

  // Deltas
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

function detectChangeType(prev: Snapshot, curr: Snapshot): ChangeType {
  if (curr.completed_bolts > prev.completed_bolts) return 'bolt_completed';
  if (curr.bolt_count > prev.bolt_count) return 'bolt_added';
  if (curr.intent_count > prev.intent_count) return 'intent_added';
  if (curr.story_count > prev.story_count) return 'story_added';
  return 'entities_removed';
}
```

## Estimate

**Size**: M
