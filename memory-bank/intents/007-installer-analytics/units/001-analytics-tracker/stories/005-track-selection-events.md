---
id: 005-track-selection-events
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: ready
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: false
---

# Story: Track IDE and Flow Selection Events

## User Story

**As a** specsmd product team member
**I want** to track which IDEs and flows users select
**So that** I can understand user preferences and prioritize IDE support

## Acceptance Criteria

- [ ] **Given** user confirms IDE selection, **When** trackIdesConfirmed() is called, **Then** ides_confirmed event is sent with ide_count and ides array
- [ ] **Given** user selects 3 IDEs, **When** tracking, **Then** ide_count is 3 and ides contains all 3 IDE names
- [ ] **Given** user selects flow, **When** trackFlowSelected() is called, **Then** flow_selected event is sent with flow name
- [ ] **Given** telemetry is disabled, **When** any track method is called, **Then** no event is sent
- [ ] **Given** Mixpanel is unreachable, **When** tracking events, **Then** errors are silently ignored

## Technical Notes

- ides_confirmed is sent ONCE after user confirms their selection
- ides array contains IDE identifiers like 'claude-code', 'cursor', 'windsurf'
- flow is the flow name like 'aidlc', 'custom'

```typescript
trackIdesConfirmed(ides: string[]): void {
  this.track('ides_confirmed', {
    ide_count: ides.length,
    ides: ides,
  });
}

trackFlowSelected(flow: string): void {
  this.track('flow_selected', { flow });
}
```

## Dependencies

### Requires
- 001-initialize-mixpanel (Mixpanel must be initialized)

### Enables
- None (end of chain)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Single IDE selected | ide_count: 1, ides: ['ide-name'] |
| Empty IDE list (edge case) | ide_count: 0, ides: [] |
| Unknown flow name | Track as-is |

## Out of Scope

- Tracking individual IDE selections before confirmation
- Tracking selection changes/deselections
