---
id: vscode-extension-story-sp-012
unit: sidebar-provider
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
assigned_bolt: bolt-sidebar-provider-5
implemented: true
---

# Story: Next Actions UI in Overview Tab

## User Story

**As a** extension user
**I want** to see suggested next actions in the Overview tab
**So that** I know what to work on next without analyzing bolts manually

## Acceptance Criteria

- [x] **Given** Overview tab is visible, **When** StateStore has computed nextActions, **Then** a "Suggested Actions" section displays
- [x] **Given** next actions exist, **When** rendering the section, **Then** actions are sorted by priority (highest first)
- [x] **Given** a next action, **When** displayed, **Then** it shows: icon, title, description, and target name if applicable
- [x] **Given** action type is continue-bolt, **When** clicked, **Then** bolt details are shown
- [x] **Given** action type is start-bolt, **When** clicked, **Then** bolt is highlighted in Bolts tab
- [x] **Given** no next actions, **When** Overview renders, **Then** show "All caught up!" message

## Technical Notes

- Read from `state.computed.nextActions`
- Action types: continue-bolt, start-bolt, complete-stage, unblock-bolt, create-bolt, celebrate
- Icons: ▶ continue, + start, ✓ complete, 🔓 unblock, 📝 create, 🎉 celebrate
- Clicking action sends message to extension for navigation

## UI Design

```
┌─────────────────────────────────────┐
│ 💡 SUGGESTED ACTIONS                │
├─────────────────────────────────────┤
│ ▶ Continue bolt-sidebar-provider-5  │
│   Resume in-progress construction   │
├─────────────────────────────────────┤
│ + Start bolt-overview-ui-1          │
│   Next unblocked bolt ready         │
└─────────────────────────────────────┘
```

## Dependencies

### Requires
- state/selectors.ts (selectNextActions)
- StateStore integration

### Enables
- Guided workflow experience
