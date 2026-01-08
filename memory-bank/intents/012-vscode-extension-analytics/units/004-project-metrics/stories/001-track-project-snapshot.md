---
story: 001-track-project-snapshot
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
priority: could
status: complete
created: 2025-01-08T12:45:00.000Z
implemented: true
---

# Story: Track Project Snapshot on Activation

## User Story

**As a** specsmd maintainer
**I want** to capture project structure on activation
**So that** I can understand typical project sizes and compositions

## Acceptance Criteria

- [ ] `project_snapshot` event fires once per activation
- [ ] Only fires for specsmd projects (is_specsmd_project = true)
- [ ] Includes entity counts: intent_count, unit_count, story_count, bolt_count
- [ ] Includes bolt status breakdown: active_bolts, queued_bolts, completed_bolts, blocked_bolts
- [ ] Includes aggregates: avg_units_per_intent, avg_stories_per_unit
- [ ] Does not include project name or paths

## Technical Notes

Integration point: After scanMemoryBank in extension.ts

```typescript
// In activate(), after project detection
if (model.isProject) {
  analytics.trackProjectSnapshot({
    intent_count: model.intents.length,
    unit_count: countUnits(model),
    story_count: countStories(model),
    bolt_count: model.bolts.length,
    active_bolts: model.bolts.filter(b => b.status === 'active').length,
    queued_bolts: model.bolts.filter(b => b.status === 'pending').length,
    completed_bolts: model.bolts.filter(b => b.status === 'complete').length,
    blocked_bolts: model.bolts.filter(b => b.isBlocked).length,
    avg_units_per_intent: unitCount / intentCount,
    avg_stories_per_unit: storyCount / unitCount
  });
}
```

## Estimate

**Size**: S
