---
story: 001-track-tab-navigation
unit: 003-engagement-events
intent: 012-vscode-extension-analytics
priority: should
status: complete
created: 2025-01-08T12:40:00.000Z
implemented: true
---

# Story: Track Tab Navigation

## User Story

**As a** specsmd maintainer
**I want** to track which tabs users navigate between
**So that** I can understand which views are most valuable

## Acceptance Criteria

- [ ] `tab_changed` event fires when user switches tabs
- [ ] Includes `from_tab` (previous tab or null on first view)
- [ ] Includes `to_tab` (new active tab)
- [ ] Tab values: bolts, specs, overview
- [ ] Does not fire on initial load (only explicit navigation)

## Technical Notes

Integration point: `SpecsmdWebviewProvider._handleMessage()`

```typescript
case 'tabChange':
  const previousTab = this._store.getState().ui.activeTab;
  this.setActiveTab(message.tab);
  analytics.trackTabChanged(previousTab, message.tab);
  break;
```

## Estimate

**Size**: S
