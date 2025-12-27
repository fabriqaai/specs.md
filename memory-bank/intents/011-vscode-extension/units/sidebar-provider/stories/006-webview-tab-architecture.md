---
id: vscode-extension-story-sp-006
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Webview Tab Architecture

## User Story

**As a** user
**I want** a tabbed sidebar with Bolts, Specs, and Overview views
**So that** I can switch between different perspectives of my project

## Acceptance Criteria

- [ ] **Given** the sidebar is visible, **When** I look at it, **Then** I see three tabs: "Bolts", "Specs", "Overview"
- [ ] **Given** the Bolts tab is active, **When** I click Specs tab, **Then** the Specs view is displayed
- [ ] **Given** I'm on the Specs tab, **When** I restart VS Code, **Then** I'm still on the Specs tab
- [ ] **Given** dark theme is active, **When** I view the sidebar, **Then** it uses VS Code dark theme colors
- [ ] **Given** light theme is active, **When** I view the sidebar, **Then** it uses VS Code light theme colors
- [ ] **Given** the sidebar, **When** I click the refresh icon, **Then** the current view refreshes

## Technical Notes

- Use WebviewViewProvider instead of TreeDataProvider
- Tab state stored in `context.workspaceState`
- Use VS Code CSS variables: `--vscode-sideBar-background`, `--vscode-editor-foreground`, etc.
- Implement CSP headers for webview security
- Use nonce for inline scripts
- PostMessage API for webview ↔ extension communication

## Dependencies

### Requires
- artifact-parser (for data)
- file-watcher (for refresh events)

### Enables
- 007-command-center-bolts-tab
- Specs tab rendering
- Overview tab rendering

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Webview disposed and recreated | Restore previous tab state |
| Invalid stored tab value | Default to Bolts tab |
| Theme changed while open | Update immediately |
| Extension deactivated | Clean up resources |

## Out of Scope

- Custom tab icons (use text/emoji for now)
- Tab reordering
- Tab hiding/showing
