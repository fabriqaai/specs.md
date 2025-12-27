---
id: vscode-extension-story-ec-002
unit: extension-core
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Command Registration

## User Story

**As a** VS Code user
**I want** extension commands to be available
**So that** I can interact with the sidebar via commands and shortcuts

## Acceptance Criteria

- [ ] **Given** extension activates, **When** commands registered, **Then** "specsmd.refresh" command is available
- [ ] **Given** refresh command, **When** executed, **Then** tree view refreshes
- [ ] **Given** sidebar title bar, **When** rendered, **Then** refresh icon button is visible
- [ ] **Given** refresh button, **When** clicked, **Then** specsmd.refresh command executes
- [ ] **Given** command palette, **When** searching "specsmd", **Then** relevant commands appear

## Technical Notes

- Use vscode.commands.registerCommand
- Commands in package.json contributes.commands
- Refresh button via contributes.menus["view/title"]
- Command IDs: specsmd.refresh, specsmd.revealInExplorer, specsmd.copyPath

## Dependencies

### Requires
- 001-extension-activation
- sidebar-provider (for refresh target)

### Enables
- 003-file-operation-commands

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Command called without tree | No-op or show message |
| Rapid refresh clicks | Debounced by file-watcher |

## Out of Scope

- Custom keyboard shortcuts
- Command arguments
