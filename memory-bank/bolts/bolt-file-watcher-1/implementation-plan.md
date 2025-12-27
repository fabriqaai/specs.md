---
stage: plan
bolt: bolt-file-watcher-1
created: 2025-12-25T19:30:00Z
---

# Implementation Plan: file-watcher

## Objective

Implement file system watching for the memory-bank directory with debounced change handling, enabling real-time updates to the sidebar when artifacts are modified.

## Stories in Scope

| Story | Title | Priority |
|-------|-------|----------|
| 001 | File System Watcher Setup | Must |
| 002 | Debounced Change Handling | Must |

---

## Deliverables

### 1. FileWatcher Class

```typescript
// vs-code-extension/src/watcher/fileWatcher.ts
export class FileWatcher implements vscode.Disposable {
    constructor(workspacePath: string, onChangeCallback: () => void)

    start(): void
    dispose(): void
}
```

### 2. Debounce Utility

```typescript
// vs-code-extension/src/watcher/debounce.ts
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): { call: T; cancel: () => void }
```

### 3. TypeScript Interfaces

```typescript
// vs-code-extension/src/watcher/types.ts
export type FileChangeType = 'create' | 'change' | 'delete';

export interface FileChangeEvent {
    type: FileChangeType;
    uri: vscode.Uri;
}
```

---

## Dependencies

### Internal (from bolt-artifact-parser-1)

| Module | Purpose |
|--------|---------|
| MemoryBankSchema | Get memory-bank path for glob pattern |

### VS Code APIs

| API | Purpose |
|-----|---------|
| vscode.workspace.createFileSystemWatcher | Create file watcher |
| vscode.RelativePattern | Scope watcher to workspace |
| vscode.Disposable | Cleanup interface |

---

## Technical Approach

### File Structure

```
vs-code-extension/src/watcher/
├── index.ts           # Re-exports
├── types.ts           # TypeScript interfaces
├── debounce.ts        # Debounce utility
└── fileWatcher.ts     # Main FileWatcher class
```

### Glob Pattern

```
**/memory-bank/**/*.md
```

This pattern watches:
- All `.md` files in memory-bank directory
- All subdirectories recursively
- Ignores non-markdown files

### Debounce Implementation

- Delay: 100ms (as per FR-5.4)
- Reset timer on each new event
- Cancel timer on dispose
- Single callback after quiet period

### Lifecycle

1. **start()**: Create FileSystemWatcher, attach event handlers
2. **onChange**: Debounce and call callback
3. **dispose()**: Clear timer, dispose watcher

---

## Acceptance Criteria

### Story 001: File System Watcher Setup

- [x] FileSystemWatcher created for memory-bank/**/*.md
- [x] Detects file creation
- [x] Detects file modification
- [x] Detects file deletion
- [x] Ignores non-.md files
- [x] Properly disposes on deactivation

### Story 002: Debounced Change Handling

- [x] 100ms debounce delay
- [x] Multiple changes in 100ms = single callback
- [x] Timer resets on new change
- [x] Timer cancelled on dispose

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| File renamed | delete + create events, single debounced callback |
| Git checkout | Many changes, single debounced callback |
| Auto-save | Each save after 100ms quiet triggers callback |
| Extension deactivate during debounce | Timer cancelled, no callback |
| No memory-bank folder | Watcher still created, no events |

---

## Out of Scope

- Watching .specsmd/ folder
- Watching non-markdown files
- Configurable debounce delay
- Different delays for different event types
- Incremental updates (full refresh only)
