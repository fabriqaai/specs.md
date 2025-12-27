---
stage: implement
bolt: bolt-extension-core-1
created: 2025-12-25T22:45:00Z
---

## Implementation Walkthrough: extension-core

### Summary

Created the main extension entry point that wires together all previously built modules - parser, watcher, sidebar provider, and welcome view. The extension activates on workspace open, registers views and commands, and sets up file watching for auto-refresh.

### Structure Overview

Single extension.ts file that serves as the orchestration layer, importing and coordinating all other modules. Uses VS Code's extension context for proper resource lifecycle management.

### Completed Work

- [x] `src/extension.ts` - Main entry point with activate/deactivate
- [x] `resources/favicon.png` - Activity bar icon (copied from docs)
- [x] Fixed WelcomeViewProvider viewType to match package.json

### Key Decisions

- **Single Entry Point**: All initialization logic in extension.ts for clarity
- **Context-Based Cleanup**: All disposables added to context.subscriptions
- **Dual File Watchers**: Main watcher for refresh, installation watcher for project detection
- **Command Arguments**: TreeNode passed as argument for file operations

### Deviations from Plan

- Added `specsmd.openArtifact` command (used by tree item click handler)
- Fixed WelcomeViewProvider.viewType from `specsmd.welcomeView` to `specsmdWelcome`

### Dependencies Added

None - uses existing modules and VS Code API.

### Developer Notes

- Extension activates on workspace containing memory-bank or .specsmd
- specsmd.isProject context controls view visibility (tree vs welcome)
- Tree view ID is `specsmdTree`, welcome view ID is `specsmdWelcome`
- File watcher triggers tree refresh and context update
- Installation watcher handles post-install project detection
