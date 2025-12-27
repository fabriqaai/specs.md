---
unit: extension-core
intent: 011-vscode-extension
phase: construction
status: complete
created: 2025-12-25
updated: 2025-12-26
default_bolt_type: simple-construction-bolt
---

# Unit Brief: Extension Core

## Purpose

Extension entry point, lifecycle management, command registration, and orchestration of all other units. This is the main module that VS Code loads and the coordinator for the extension's functionality.

## Scope

### In Scope

- Extension activation (activate function)
- Extension deactivation (deactivate function)
- Register TreeDataProvider with VS Code
- Register all commands (refresh, reveal, copy path, etc.)
- Coordinate initialization of other units
- Register sidebar view container and view
- Handle click events and route to appropriate handlers

### Out of Scope

- Tree rendering (handled by sidebar-provider)
- File parsing (handled by artifact-parser)
- File watching (handled by file-watcher)
- Welcome view (handled by welcome-view)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Provide sidebar view in VS Code activity bar | Must |
| FR-1.3 | Sidebar titled "specsmd" with favicon.png icon | Must |
| FR-1.6 | Refresh icon button in title bar | Must |
| FR-4.1 | Single-click selects item in tree | Must |
| FR-4.2 | Double-click opens in default editor | Must |
| FR-4.3 | No custom editors in Phase 1 | Must |
| FR-4.4 | "Reveal in Explorer" context menu | Must |
| FR-4.5 | "Copy Path" context menu | Must |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| ExtensionContext | VS Code extension context | subscriptions, extensionPath |
| Command | Registered command | id, handler |
| ViewContainer | Activity bar container | id, title, icon |
| View | Sidebar view | id, name, provider |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| activate | Extension entry point | context | void |
| deactivate | Extension cleanup | - | void |
| registerCommands | Register all commands | context | void |
| registerViews | Register sidebar views | context | void |
| initializeUnits | Initialize all other units | - | void |
| handleRefresh | Handle refresh command | - | void |
| handleOpenFile | Handle file open on double-click | uri | void |
| handleRevealInExplorer | Reveal file in explorer | uri | void |
| handleCopyPath | Copy path to clipboard | uri | void |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 3 |
| Must Have | 3 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Extension Activation and View Registration | Must | Planned |
| 002 | Command Registration | Must | Planned |
| 003 | File Operations Commands | Must | Planned |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| artifact-parser | Initialize for project detection |
| sidebar-provider | Register as TreeDataProvider |
| file-watcher | Initialize and manage lifecycle |
| welcome-view | Conditionally show based on project state |

### Depended By

| Unit | Reason |
|------|--------|
| None | This is the entry point |

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| VS Code Extension API | Core extension functionality | Low |
| VS Code Commands API | Command registration | Low |
| VS Code Window API | File operations | Low |

---

## Technical Context

### Suggested Technology

- vscode.ExtensionContext for lifecycle
- vscode.commands.registerCommand for commands
- vscode.window.createTreeView for sidebar
- vscode.window.showTextDocument for file open
- vscode.commands.executeCommand for reveal in explorer

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| VS Code Extension API | API | activate/deactivate |
| VS Code Commands | API | registerCommand |
| VS Code TreeView | API | createTreeView |
| All other units | Import | TypeScript |

### Data Storage

| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| None | - | - | - |

---

## Constraints

- Must export activate and deactivate functions
- Must properly dispose all subscriptions
- Must handle activation events correctly
- package.json must declare all commands and views

---

## Success Criteria

### Functional

- [ ] Extension activates without errors
- [ ] Sidebar appears in activity bar with correct icon
- [ ] Refresh command triggers tree refresh
- [ ] Double-click opens file in editor
- [ ] "Reveal in Explorer" works
- [ ] "Copy Path" copies to clipboard
- [ ] Extension deactivates cleanly

### Non-Functional

- [ ] Activation time < 500ms
- [ ] No memory leaks after deactivation
- [ ] No errors in extension host

### Quality

- [ ] Integration tests for activation
- [ ] Command tests
- [ ] Code coverage > 80%

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-extension-core-1 | Simple | 001, 002, 003 | Complete extension core functionality |

---

## Notes

- package.json contributions (to be created):
```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [{
        "id": "specsmd",
        "title": "specsmd",
        "icon": "resources/favicon.png"
      }]
    },
    "views": {
      "specsmd": [{
        "id": "specsmd.artifactTree",
        "name": "Memory Bank"
      }]
    },
    "commands": [
      { "command": "specsmd.refresh", "title": "Refresh", "icon": "$(refresh)" },
      { "command": "specsmd.revealInExplorer", "title": "Reveal in Explorer" },
      { "command": "specsmd.copyPath", "title": "Copy Path" }
    ]
  }
}
```
- Activation events should include `onView:specsmd.artifactTree`
- Consider lazy loading units for faster activation
