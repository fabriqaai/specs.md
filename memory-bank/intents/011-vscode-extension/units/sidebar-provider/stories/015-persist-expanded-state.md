---
id: vscode-extension-story-sp-015
unit: sidebar-provider
intent: 011-vscode-extension
status: in-progress
priority: should
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: partial
---

# Story: Persist Expanded State

## User Story

**As a** extension user
**I want** my expanded/collapsed nodes to persist across sessions
**So that** I don't have to re-expand my preferred view each time

## Acceptance Criteria

- [ ] **Given** user expands an intent node, **When** session ends and restarts, **Then** that intent is still expanded
- [ ] **Given** user expands a unit node, **When** session ends and restarts, **Then** that unit is still expanded
- [ ] **Given** user collapses Focus Card, **When** session ends and restarts, **Then** Focus Card is still collapsed
- [ ] **Given** persisted state references deleted node, **When** loading, **Then** that entry is ignored (no error)

## Technical Notes

Storage keys in workspaceState:
- `specsmd.expandedIntents` - Set<string> of intent IDs
- `specsmd.expandedUnits` - Set<string> of unit IDs
- `specsmd.focusCardExpanded` - boolean (already exists)

Operations:
- On expand: Add ID to set, persist to workspaceState
- On collapse: Remove ID from set, persist to workspaceState
- On load: Restore sets from workspaceState, apply to UIState

UIState additions:
```typescript
interface UIState {
  expandedIntents: Set<string>;
  expandedUnits: Set<string>;
  focusCardExpanded: boolean;
  // ... existing fields
}
```

## Dependencies

### Requires
- VS Code workspaceState API
- StateStore UIState

### Enables
- Better user experience with persistent view preferences
