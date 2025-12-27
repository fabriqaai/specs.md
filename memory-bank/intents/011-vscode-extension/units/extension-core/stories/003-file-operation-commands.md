---
id: vscode-extension-story-ec-003
unit: extension-core
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: File Operations Commands

## User Story

**As a** developer browsing the tree
**I want** to open, reveal, and copy paths of artifacts
**So that** I can work with files efficiently

## Acceptance Criteria

- [ ] **Given** a tree item, **When** single-clicked, **Then** item is selected (highlighted)
- [ ] **Given** a tree item (file), **When** double-clicked, **Then** file opens in VS Code default editor
- [ ] **Given** a tree item, **When** right-click context menu, **Then** "Reveal in Explorer" option appears
- [ ] **Given** "Reveal in Explorer" clicked, **When** command executes, **Then** file is shown in OS file explorer
- [ ] **Given** a tree item, **When** right-click context menu, **Then** "Copy Path" option appears
- [ ] **Given** "Copy Path" clicked, **When** command executes, **Then** file path is copied to clipboard

## Technical Notes

- Double-click: use TreeItem.command to open file
- Use vscode.commands.executeCommand('revealFileInOS', uri) for reveal
- Use vscode.env.clipboard.writeText(path) for copy
- Context menu via contributes.menus["view/item/context"]

## Dependencies

### Requires
- 002-command-registration
- sidebar-provider (provides tree items)

### Enables
- Complete file interaction

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| File deleted before open | Show error "File not found" |
| Non-file item (section header) | Context menu hidden or disabled |
| Path with special characters | Properly escaped |

## Out of Scope

- Delete file from tree
- Rename file from tree
- Create new file from tree
