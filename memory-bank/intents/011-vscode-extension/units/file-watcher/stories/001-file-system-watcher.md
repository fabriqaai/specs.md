---
id: vscode-extension-story-fw-001
unit: file-watcher
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: File System Watcher Setup

## User Story

**As a** extension user
**I want** the sidebar to automatically detect file changes in memory-bank
**So that** I see updates without manually refreshing

## Acceptance Criteria

- [ ] **Given** extension is activated, **When** startWatching() is called, **Then** FileSystemWatcher is created for memory-bank/**/*.md
- [ ] **Given** watcher is active, **When** a new .md file is created in memory-bank, **Then** onChange callback is triggered
- [ ] **Given** watcher is active, **When** a .md file is modified, **Then** onChange callback is triggered
- [ ] **Given** watcher is active, **When** a .md file is deleted, **Then** onChange callback is triggered
- [ ] **Given** watcher is active, **When** extension deactivates, **Then** watcher is disposed (no memory leak)
- [ ] **Given** watcher is active, **When** a non-.md file changes, **Then** onChange is NOT triggered

## Technical Notes

- Use vscode.workspace.createFileSystemWatcher
- Glob pattern: `**/memory-bank/**/*.md`
- Return Disposable for cleanup
- Store watcher in ExtensionContext.subscriptions

## Dependencies

### Requires
- artifact-parser/001-memory-bank-schema (for watch path)

### Enables
- sidebar-provider tree refresh

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| File renamed | Triggers delete + create events |
| Folder created | May trigger if glob matches |
| Git operations | Multiple rapid events (handled by debounce) |
| External editor saves | Events still captured |

## Out of Scope

- Watching .specsmd/ folder
- Watching non-markdown files
- Recursive depth limits
