---
stage: plan
bolt: bolt-extension-core-1
created: 2025-12-25T22:30:00Z
---

## Implementation Plan: extension-core

### Objective

Create the extension entry point that wires together all units - activation, view registration, command handling, and file operations. This is the final bolt that enables the full extension functionality.

### Deliverables

- `src/extension.ts` - Main entry point with activate/deactivate
- `resources/favicon.png` - Activity bar icon (copy from docs)
- Update existing modules to export required types

### Dependencies

- **bolt-artifact-parser-1**: `scanMemoryBank()` for model loading
- **bolt-file-watcher-1**: `FileWatcher` for change detection
- **bolt-sidebar-provider-1/2**: `MemoryBankTreeProvider` for tree view
- **bolt-welcome-view-1**: `WelcomeViewProvider` for onboarding

### Technical Approach

1. **Activation**:
   - Register TreeDataProvider with `vscode.window.registerTreeDataProvider`
   - Register WebviewViewProvider with `vscode.window.registerWebviewViewProvider`
   - Detect project state and set `specsmd.isProject` context
   - Initialize FileWatcher for auto-refresh

2. **Commands**:
   - `specsmd.refresh`: Trigger tree refresh via file watcher
   - `specsmd.openFile`: Open file via TreeItem.command
   - `specsmd.revealInExplorer`: Execute `revealFileInOS` command
   - `specsmd.copyPath`: Copy path to clipboard

3. **Tree Item Commands**:
   - Set `command` property on TreeItem for double-click behavior
   - Set `contextValue` for context menu visibility

4. **Cleanup**:
   - Add all disposables to context.subscriptions
   - Dispose file watcher on deactivation

### File Structure

```
vs-code-extension/
├── resources/
│   ├── favicon.png    # Activity bar icon (copy from docs)
│   └── logo.png       # Welcome view logo (already exists)
└── src/
    └── extension.ts   # Main entry point
```

### Acceptance Criteria

- [ ] Extension activates without errors
- [ ] Activity bar icon visible (favicon.png)
- [ ] Sidebar shows welcome view for non-specsmd workspaces
- [ ] Sidebar shows tree view for specsmd workspaces
- [ ] Refresh command works (both button and command palette)
- [ ] Double-click opens files
- [ ] Reveal in Explorer works
- [ ] Copy Path works
- [ ] Clean deactivation (no memory leaks)
- [ ] All 121+ tests still pass
