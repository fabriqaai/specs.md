---
id: vscode-extension-story-sp-013
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: should
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Start Bolt Action

## User Story

**As a** extension user
**I want** to start a bolt from the UI
**So that** I can easily get the command to begin work on a bolt

## Acceptance Criteria

- [x] **Given** a draft bolt in Up Next queue, **When** "Start" button is clicked, **Then** a popup appears with the command to run
- [x] **Given** popup is shown, **When** user clicks "Copy", **Then** the command is copied to clipboard
- [x] **Given** bolt has dependencies, **When** dependencies are incomplete, **Then** Start button is disabled with tooltip "Blocked by: bolt-x"

## Technical Notes

**IMPORTANT**: We cannot programmatically modify markdown files. Instead, show a popup with the command to copy.

- Webview sends `startBolt` message with boltId
- Extension handler:
  1. Show VS Code QuickPick or Information Message with the command
  2. Command format: `/specsmd-construction-agent --bolt-id="bolt-xxx"`
  3. Provide "Copy to Clipboard" button
- User runs the command manually in Claude Code to start the bolt

## UI Flow

```
User clicks [Start ▶] on bolt-sidebar-provider-5
    ↓
VS Code popup appears:
┌─────────────────────────────────────────────────┐
│ Run this command to start the bolt:             │
│                                                 │
│ /specsmd-construction-agent --bolt-id="..."     │
│                                                 │
│            [Copy to Clipboard]                  │
└─────────────────────────────────────────────────┘
```

## Queue UI Design

```
┌─────────────────────────────────────┐
│ UP NEXT                     2 bolts │
├─────────────────────────────────────┤
│ bolt-overview-ui-1     [Start ▶]    │
│ Simple • 3 stories                  │
├─────────────────────────────────────┤
│ bolt-deploy-1          [Blocked]    │
│ Blocked by: bolt-overview-ui-1      │
└─────────────────────────────────────┘
```

## Dependencies

### Requires
- StateStore (to get bolt data for command generation)

### Enables
- Guided workflow experience
