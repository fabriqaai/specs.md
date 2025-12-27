---
unit: welcome-view
intent: 011-vscode-extension
phase: construction
status: complete
created: 2025-12-25
updated: 2025-12-26
default_bolt_type: simple-construction-bolt
---

# Unit Brief: Welcome View

## Purpose

Display a welcome/empty state view when no specsmd project is detected in the workspace. Provide onboarding experience with installation prompt and copyable command.

## Scope

### In Scope

- Detect when workspace lacks specsmd (no memory-bank/ AND no .specsmd/)
- Display welcome view with:
  - specs.md pixel logo (clickable → specs.md website)
  - Brief explanation of specsmd
  - "Install" button
  - Copyable command text
- Handle Install button click:
  - Show confirmation dialog
  - Open VS Code terminal
  - Paste install command (don't auto-execute)
- Auto-refresh when installation detected

### Out of Scope

- Actual specsmd installation (user runs command)
- Post-installation configuration
- Tree view (handled by sidebar-provider)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Detect if workspace lacks specsmd | Must |
| FR-7.2 | Show welcome view with logo, explanation, button, copyable command | Must |
| FR-7.3 | Show confirmation dialog on Install click | Must |
| FR-7.4 | Open VS Code integrated terminal | Must |
| FR-7.5 | Paste `npx specsmd@latest install` command | Must |
| FR-7.6 | Do NOT auto-execute (user presses Enter) | Must |
| FR-7.7 | Auto-refresh sidebar after installation detected | Must |

---

## Domain Concepts

### Key Entities

| Entity | Description | Attributes |
|--------|-------------|------------|
| WelcomeViewProvider | Webview provider for welcome | webview, logo, installCommand |
| InstallationState | Whether project is initialized | detected: boolean |

### Key Operations

| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| showWelcomeView | Display welcome webview | - | void |
| hideWelcomeView | Hide and show tree | - | void |
| handleInstallClick | Process install button | - | void |
| openTerminalWithCommand | Open terminal, paste command | command | void |
| copyCommand | Copy command to clipboard | - | void |
| checkInstallation | Check if folders appeared | - | boolean |

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
| 001 | Welcome View UI | Must | Planned |
| 002 | Install Button Flow | Must | Planned |
| 003 | Post-Installation Detection | Must | Planned |

---

## Dependencies

### Depends On

| Unit | Reason |
|------|--------|
| artifact-parser | Uses detectProject() |

### Depended By

| Unit | Reason |
|------|--------|
| extension-core | Conditionally shows welcome vs tree |

### External Dependencies

| System | Purpose | Risk |
|--------|---------|------|
| VS Code Webview API | Welcome view rendering | Low |
| VS Code Terminal API | Open and paste command | Low |
| Web Browser | Open specs.md link | Low |

---

## Technical Context

### Suggested Technology

- vscode.WebviewViewProvider for welcome panel
- HTML/CSS for welcome content
- vscode.window.createTerminal for terminal
- vscode.env.clipboard for copy
- vscode.env.openExternal for website link

### Integration Points

| Integration | Type | Protocol |
|-------------|------|----------|
| VS Code Webview | API | WebviewViewProvider |
| VS Code Terminal | API | vscode.Terminal |
| VS Code Clipboard | API | vscode.env.clipboard |
| External Browser | API | vscode.env.openExternal |

### Data Storage

| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| None | - | - | - |

---

## Constraints

- Logo must be bundled with extension (can't load from remote)
- Command must NOT auto-execute (security)
- Terminal must be VS Code integrated terminal (not external)

---

## Success Criteria

### Functional

- [ ] Welcome view shown when no specsmd detected
- [ ] Logo displays and clicks to specs.md
- [ ] Explanation text is clear and helpful
- [ ] Install button shows confirmation dialog
- [ ] Terminal opens with command pasted
- [ ] Command is NOT auto-executed
- [ ] Copy button copies command to clipboard
- [ ] Sidebar auto-refreshes after installation

### Non-Functional

- [ ] Welcome view renders in < 200ms
- [ ] Logo looks good in light and dark themes

### Quality

- [ ] Visual tests for welcome view
- [ ] Integration test for terminal flow
- [ ] Code coverage > 80%

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-welcome-view-1 | Simple | 001, 002, 003 | Complete welcome view functionality |

---

## Notes

- Welcome view mockup (from requirements):
```
┌─────────────────────────────────┐
│                                 │
│      [specs.md pixel logo]      │
│         ↑ clicks to specs.md    │
│                                 │
│  AI-DLC workflow management     │
│  for agentic coding tools       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ npx specsmd@latest      │ 📋 │  ← copyable
│  │ install                 │    │
│  └─────────────────────────┘    │
│                                 │
│       [ Install specsmd ]       │  ← button
│                                 │
└─────────────────────────────────┘
```
- Use VS Code's `when` clause to conditionally show welcome vs tree view
- Consider using TreeView's `message` property as simpler alternative to webview
