---
id: vscode-extension-story-sp-016
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: should
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: false
---

# Story: Bolt Filtering

## User Story

**As a** extension user
**I want** to filter bolts by intent, status, or type
**So that** I can focus on specific bolts in a large project

## Acceptance Criteria

- [ ] **Given** Bolts tab is visible, **When** filter dropdown is clicked, **Then** filter options display
- [ ] **Given** filter by intent, **When** intent is selected, **Then** only bolts for that intent show
- [ ] **Given** filter by status, **When** status is selected, **Then** only bolts matching that status show
- [ ] **Given** filter by type, **When** type is selected, **Then** only bolts of that type show
- [ ] **Given** filters are applied, **When** "Clear filters" is clicked, **Then** all bolts show
- [ ] **Given** filter is active, **When** session restarts, **Then** filter persists

## Technical Notes

Filter options:
- **By Intent**: All | Intent-001 | Intent-002 | ...
- **By Status**: All | In Progress | Draft | Complete | Blocked
- **By Type**: All | DDD | Simple | ...

Storage key: `specsmd.boltFilters`

UIState additions:
```typescript
interface BoltFilters {
  intentId: string | null;
  status: ArtifactStatus | null;
  type: string | null;
}

interface UIState {
  boltFilters: BoltFilters;
  // ... existing fields
}
```

UI Design:
```
┌─────────────────────────────────────┐
│ 🎯 CURRENT FOCUS      [Filter ▼]   │
│                       ┌───────────┐ │
│                       │ Intent ▸  │ │
│                       │ Status ▸  │ │
│                       │ Type   ▸  │ │
│                       │───────────│ │
│                       │ Clear All │ │
│                       └───────────┘ │
```

## Dependencies

### Requires
- StateStore UIState
- VS Code workspaceState (persistence)

### Enables
- Better bolt management in large projects
