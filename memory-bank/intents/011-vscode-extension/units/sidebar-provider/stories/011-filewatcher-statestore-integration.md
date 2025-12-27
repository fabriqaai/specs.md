---
id: vscode-extension-story-sp-011
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: FileWatcher → StateStore Integration

## User Story

**As a** extension user
**I want** the StateStore to automatically update when files change
**So that** the UI reflects the latest memory-bank state without manual refresh

## Acceptance Criteria

- [x] **Given** FileWatcher detects a markdown file change, **When** the change event fires, **Then** StateStore.loadFromModel() is called with fresh parsed data
- [x] **Given** multiple rapid file changes, **When** debounce period completes, **Then** only one StateStore update occurs
- [x] **Given** StateStore is updated, **When** subscribers are notified, **Then** WebviewProvider refreshes the UI
- [x] **Given** extension deactivates, **When** cleanup runs, **Then** both FileWatcher and StateStore subscriptions are disposed

## Technical Notes

- Connect FileWatcher.onChange → scanMemoryBank → StateStore.loadFromModel
- Ensure debounce is applied before StateStore update (already in FileWatcher)
- StateStore already has subscriber notification built-in
- Use single source of truth pattern (FileWatcher is only write path to StateStore)

## Dependencies

### Requires
- file-watcher unit (FileWatcher class)
- state module (StateStore)

### Enables
- Real-time UI updates on file changes

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Parse error on file change | Log error, keep previous state |
| Rapid saves (IDE auto-save) | Single update after debounce |
| Webview not visible | StateStore updates, webview updates on show |
