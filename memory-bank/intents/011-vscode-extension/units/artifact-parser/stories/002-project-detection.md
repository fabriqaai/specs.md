---
id: vscode-extension-story-ap-002
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Project Detection

## User Story

**As a** VS Code user opening a workspace
**I want** the extension to detect if this is a specsmd project
**So that** I see the appropriate view (welcome or artifact tree)

## Acceptance Criteria

- [ ] **Given** a workspace with `memory-bank/` folder, **When** detectProject() is called, **Then** return true
- [ ] **Given** a workspace with `.specsmd/` folder, **When** detectProject() is called, **Then** return true
- [ ] **Given** a workspace with both folders, **When** detectProject() is called, **Then** return true
- [ ] **Given** a workspace with neither folder, **When** detectProject() is called, **Then** return false
- [ ] **Given** a workspace with empty `memory-bank/` folder, **When** detectProject() is called, **Then** return true (folder exists)

## Technical Notes

- Use VS Code workspace API (vscode.workspace.workspaceFolders)
- Check folder existence using fs.existsSync or vscode.workspace.fs
- Should be fast (< 50ms) as it runs on activation

## Dependencies

### Requires
- 001-memory-bank-schema (for path definitions)

### Enables
- welcome-view/001-welcome-view-ui
- sidebar-provider/001-tree-data-provider-setup

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No workspace open | Return false |
| Multi-root workspace | Check first root only (single workspace support) |
| Symlinked folders | Follow symlinks, detect project |

## Out of Scope

- Multi-root workspace detection
- Remote workspace detection
