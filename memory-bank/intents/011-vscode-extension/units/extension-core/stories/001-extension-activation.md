---
id: vscode-extension-story-ec-001
unit: extension-core
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Extension Activation and View Registration

## User Story

**As a** VS Code user
**I want** the specsmd extension to activate and show in the activity bar
**So that** I can access the memory-bank dashboard

## Acceptance Criteria

- [ ] **Given** VS Code starts with extension installed, **When** workspace opens, **Then** extension activates
- [ ] **Given** extension activates, **When** activation completes, **Then** "specsmd" icon appears in activity bar
- [ ] **Given** activity bar icon, **When** clicked, **Then** sidebar panel opens
- [ ] **Given** extension activates, **When** checking project state, **Then** shows welcome view OR tree view appropriately
- [ ] **Given** extension, **When** VS Code closes, **Then** deactivate function cleans up resources
- [ ] **Given** extension, **When** checking icon, **Then** uses favicon.png from resources

## Technical Notes

- Export activate(context: ExtensionContext) and deactivate()
- Register TreeDataProvider in activate
- Add all disposables to context.subscriptions
- Use vscode.window.registerWebviewViewProvider for welcome view

## Dependencies

### Requires
- All other units (coordinates them)

### Enables
- All extension functionality

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Activation error | Log error, show notification |
| No workspace | Extension activates, shows "no workspace" state |
| Slow file system | Activation completes, tree loads async |

## Out of Scope

- Lazy activation optimization
- Remote workspace support
