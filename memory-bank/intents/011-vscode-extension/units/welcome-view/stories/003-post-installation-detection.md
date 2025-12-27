---
id: vscode-extension-story-wv-003
unit: welcome-view
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Post-Installation Detection

## User Story

**As a** VS Code user who just installed specsmd
**I want** the sidebar to automatically show my artifacts
**So that** I don't have to manually refresh or reload

## Acceptance Criteria

- [ ] **Given** welcome view is showing, **When** memory-bank/ folder appears, **Then** sidebar auto-switches to tree view
- [ ] **Given** welcome view is showing, **When** .specsmd/ folder appears, **Then** sidebar auto-switches to tree view
- [ ] **Given** installation detected, **When** switching to tree view, **Then** tree shows newly created artifacts
- [ ] **Given** file watcher is active, **When** folders created, **Then** detection happens within 1 second

## Technical Notes

- Leverage file-watcher for detecting new folders
- May need separate watcher for root folders (memory-bank, .specsmd)
- On detection, hide welcome webview, show tree view
- Use VS Code's `setContext` command to toggle view visibility

## Dependencies

### Requires
- 002-install-button-flow
- file-watcher/001-file-system-watcher
- artifact-parser/002-project-detection

### Enables
- Seamless onboarding experience

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Partial installation (only .specsmd) | Switch to tree, show what's available |
| User creates folders manually | Same behavior as installer |
| Installation fails | Welcome view remains |

## Out of Scope

- Detecting installation errors
- Prompting user to complete installation
