---
id: vscode-extension-story-fw-002
unit: file-watcher
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Debounced Change Handling

## User Story

**As a** extension user
**I want** rapid file changes to be debounced
**So that** the tree doesn't flicker during batch operations

## Acceptance Criteria

- [ ] **Given** watcher detects a file change, **When** 100ms passes without more changes, **Then** refresh callback is triggered once
- [ ] **Given** watcher detects 10 changes in 50ms, **When** 100ms passes after last change, **Then** refresh callback is triggered only once
- [ ] **Given** debounce timer is running, **When** another change occurs, **Then** timer resets to 100ms
- [ ] **Given** debounce is active, **When** extension deactivates, **Then** pending timer is cancelled

## Technical Notes

- Use setTimeout/clearTimeout for debouncing
- Debounce delay: 100ms (as per FR-5.4)
- Consider using lodash.debounce or custom implementation
- Ensure timer is cleared on dispose

## Dependencies

### Requires
- 001-file-system-watcher

### Enables
- Smooth sidebar updates

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Auto-save every 1s | Each save triggers debounced refresh |
| git checkout | Many files change, single refresh |
| File save + immediate close | Debounce captures the save |

## Out of Scope

- Configurable debounce delay
- Different delays for different event types
