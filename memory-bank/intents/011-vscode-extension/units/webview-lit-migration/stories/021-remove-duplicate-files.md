---
id: vscode-extension-story-wlm-021
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
implemented: true
priority: must
created: 2025-12-26
---

# Story: Remove Duplicate Webview Files

## User Story

**As a** developer
**I want** a single source of truth for webview code
**So that** I don't get confused about which file to edit

## Problem

Currently there are duplicate files causing confusion:

```
src/
├── sidebar/
│   ├── styles.ts           # 1607 lines - NOT USED
│   ├── webviewContent.ts   # 701 lines - NOT USED (legacy)
│   └── webviewProvider.ts  # Uses ../webview/
└── webview/
    ├── index.ts            # Main entry - USED
    ├── html.ts             # HTML generation - USED
    ├── scripts.ts          # JavaScript - USED
    └── styles.ts           # 1141 lines - USED
```

## Acceptance Criteria

- [ ] **Given** duplicate files exist, **When** cleanup runs, **Then** unused files are removed
- [ ] **Given** single webview module, **When** developer edits, **Then** only one location exists
- [ ] **Given** tests reference old files, **When** tests run, **Then** all tests pass with new structure
- [ ] **Given** imports updated, **When** compiled, **Then** no dead code warnings

## Technical Implementation

### 1. Remove Unused Files
```bash
rm src/sidebar/styles.ts
rm src/sidebar/webviewContent.ts
```

### 2. Update Any Stale Imports
Search for any remaining references to removed files.

### 3. Consolidate Test Files
Move/update `src/test/sidebar/webviewContent.test.ts` if it exists.

### 4. Final Structure
```
src/
├── sidebar/
│   ├── webviewProvider.ts   # WebviewViewProvider
│   ├── webviewMessaging.ts  # Message types
│   ├── treeProvider.ts      # TreeView (if used)
│   └── index.ts             # Exports
└── webview/
    ├── index.ts             # Main entry
    ├── html.ts              # HTML generation
    ├── scripts.ts           # JavaScript
    └── styles.ts            # CSS
```

## Files to Delete

- `src/sidebar/styles.ts`
- `src/sidebar/webviewContent.ts`

## Files to Update

- Any test files referencing deleted files
- Any imports referencing deleted files

## Testing

- `npm run compile` - No errors
- `npm test` - All tests pass
- Manual: Extension loads correctly

## Dependencies

### Requires
- 020-fix-infinite-rerender (ensure working baseline)

### Enables
- 022-setup-esbuild (clean codebase)
