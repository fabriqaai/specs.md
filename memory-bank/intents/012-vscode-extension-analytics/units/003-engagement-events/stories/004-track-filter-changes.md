---
story: 004-track-filter-changes
unit: 003-engagement-events
intent: 012-vscode-extension-analytics
priority: should
status: complete
created: 2025-01-08T12:40:00.000Z
implemented: true
---

# Story: Track Filter Changes

## User Story

**As a** specsmd maintainer
**I want** to track filter usage
**So that** I can understand how users organize their view

## Acceptance Criteria

- [ ] `filter_changed` event fires when user changes a filter
- [ ] Includes `filter_type`: activity, specs
- [ ] Includes `filter_value`: the selected filter option
- [ ] Activity filter values: all, stages, bolts
- [ ] Specs filter values: all, or any status string

## Technical Notes

Integration point: `SpecsmdWebviewProvider._handleMessage()`

```typescript
case 'activityFilter':
  analytics.trackFilterChanged('activity', message.filter);
  this._store.setUIState({ activityFilter: message.filter });
  break;

case 'specsFilter':
  analytics.trackFilterChanged('specs', message.filter);
  this._store.setUIState({ specsFilter: message.filter });
  break;
```

## Estimate

**Size**: S
