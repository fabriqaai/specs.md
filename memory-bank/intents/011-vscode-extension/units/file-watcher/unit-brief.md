---
unit: file-watcher
intent: 011-vscode-extension
phase: construction
status: complete
created: 2025-12-25
updated: 2025-12-26
default_bolt_type: simple-construction-bolt
---

# Unit Brief: File Watcher

## Purpose

Watch the memory-bank directory for file changes and trigger tree view refresh. Provides real-time updates to the sidebar when artifacts are created, modified, or deleted.

## Scope

### In Scope

- Watch `memory-bank/` directory recursively
- Detect file create, modify, delete events
- Debounce rapid changes (100ms)
- Trigger refresh callback on changes
- Dispose watchers on extension deactivation

### Out of Scope

- Parsing file content (handled by artifact-parser)
- Updating the tree view (handled by sidebar-provider)
- Watching files outside memory-bank

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Watch `memory-bank/` directory for changes | Must |
| FR-5.2 | Update tree view when files added/modified/deleted | Must |
| FR-5.3 | Update status indicators when frontmatter changes | Must |
| FR-5.4 | Debounce rapid file changes (100ms) | Must |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| FileWatcher | Main watcher service | watcher, debounceTimer, onChangeCallback |
| FileChangeEvent | Change event data | type (create/modify/delete), path |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| startWatching | Begin watching memory-bank | workspacePath, callback | Disposable |
| stopWatching | Stop all watchers | - | void |
| handleChange | Process file change event | FileChangeEvent | void (triggers callback) |
| debounce | Debounce rapid changes | - | void |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 2 |
| Must Have | 2 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | File System Watcher Setup | Must | Planned |
| 002 | Debounced Change Handling | Must | Planned |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| artifact-parser | Uses MemoryBankSchema for watch paths |

### Depended By

| Unit | Reason |
|------|--------|
| sidebar-provider | Subscribes to change events |
| extension-core | Manages lifecycle |

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| VS Code FileSystemWatcher | Native file watching | Low |

---

## Technical Context

### Suggested Technology

- vscode.workspace.createFileSystemWatcher
- Glob patterns for filtering
- setTimeout for debouncing

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| VS Code workspace | API | vscode.FileSystemWatcher |
| sidebar-provider | Callback | TypeScript function |

### Data Storage

| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| None | - | - | - |

---

## Constraints

- Must use VS Code's FileSystemWatcher (not Node.js fs.watch) for cross-platform support
- Must properly dispose watchers to prevent memory leaks
- Debounce must be 100ms as specified

---

## Success Criteria

### Functional

- [ ] Watcher detects file creation in memory-bank
- [ ] Watcher detects file modification
- [ ] Watcher detects file deletion
- [ ] Rapid changes are debounced (only one callback per 100ms)
- [ ] Watchers disposed on extension deactivate

### Non-Functional

- [ ] Change detection < 100ms (before debounce)
- [ ] No memory leaks from watchers

### Quality

- [ ] Unit tests with mock file system
- [ ] Integration test with actual files
- [ ] Code coverage > 80%

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-file-watcher-1 | Simple | 001, 002 | Complete file watcher functionality |

---

## Notes

- VS Code's FileSystemWatcher is more reliable than Node.js fs.watch across platforms
- Consider using a glob pattern like `**/*.md` to filter only markdown files
- Debounce prevents UI flicker during rapid saves (e.g., auto-save)
