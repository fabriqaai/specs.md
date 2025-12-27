---
id: vscode-extension-story-sp-007
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Command Center (Bolts Tab)

## User Story

**As a** user
**I want** a command center view showing my current bolt work
**So that** I can see my progress and what's coming next at a glance

## Acceptance Criteria

- [ ] **Given** the Bolts tab is active, **When** I view it, **Then** I see "Current Intent" header with intent name
- [ ] **Given** there are bolts, **When** I view Current Intent, **Then** I see statistics: X Active, Y Queued, Z Done
- [ ] **Given** an active bolt exists, **When** I view the tab, **Then** I see "Current Focus" section with the active bolt
- [ ] **Given** pending bolts exist, **When** I view the tab, **Then** I see "Up Next" queue section
- [ ] **Given** activity events exist, **When** I view the tab, **Then** I see "Recent Activity" section
- [ ] **Given** no active bolt, **When** I view the tab, **Then** Current Focus shows empty state message

## Technical Notes

- Layout structure:
  ```
  ┌─ Current Intent header ─┐
  ├─ Current Focus section ─┤
  ├─ Up Next queue ─────────┤
  ├─ Activity section ──────┤
  ```
- Current Intent shows: intent name, bolt counts by status
- Use CSS Grid or Flexbox for responsive layout
- Activity section at bottom, takes remaining space

## Dependencies

### Requires
- 006-webview-tab-architecture
- artifact-parser (bolt data)

### Enables
- 008-current-focus-card
- 009-up-next-queue
- 010-activity-feed-ui

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No intents | Show "No intents found" message |
| No bolts at all | Show empty state with guidance |
| Multiple active bolts | Show first one (shouldn't happen normally) |
| All bolts complete | Celebration/completion message |

## Out of Scope

- Intent switching (always shows current/first intent)
- Creating new bolts from UI
