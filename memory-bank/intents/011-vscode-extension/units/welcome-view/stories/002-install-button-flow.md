---
id: vscode-extension-story-wv-002
unit: welcome-view
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Install Button Flow

## User Story

**As a** VS Code user wanting to install specsmd
**I want** to click Install and have the command ready in terminal
**So that** I can easily start the installation process

## Acceptance Criteria

- [ ] **Given** welcome view displayed, **When** "Install specsmd" clicked, **Then** confirmation dialog appears
- [ ] **Given** confirmation dialog, **When** user confirms, **Then** VS Code integrated terminal opens
- [ ] **Given** terminal opened, **When** installation flow completes, **Then** `npx specsmd@latest install` is pasted into terminal
- [ ] **Given** command pasted, **When** user views terminal, **Then** command is NOT auto-executed (cursor after command)
- [ ] **Given** confirmation dialog, **When** user cancels, **Then** nothing happens, welcome view remains

## Technical Notes

- Use vscode.window.showInformationMessage with modal for confirmation
- Use vscode.window.createTerminal to open terminal
- Use terminal.sendText(command, false) - false prevents auto-execute
- Terminal name: "specsmd install"

## Dependencies

### Requires
- 001-welcome-view-ui

### Enables
- 003-post-installation-detection

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Terminal already open | Create new terminal or reuse? (new) |
| User closes terminal before Enter | Installation not started |
| No workspace open | Show error, can't install |

## Out of Scope

- Auto-detecting installation success
- Retry logic
- Progress indication during install
