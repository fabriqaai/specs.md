---
id: vscode-extension-story-sp-010
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Activity Feed UI

## User Story

**As a** user
**I want** to see recent activity in my project
**So that** I can track what's been happening and when

## Acceptance Criteria

- [ ] **Given** activity events exist, **When** I view Recent Activity, **Then** I see a list of events
- [ ] **Given** an activity item, **When** I view it, **Then** I see: icon, description, target, tag, relative time
- [ ] **Given** filter buttons (All, Stages, Bolts), **When** I click "Stages", **Then** only stage events show
- [ ] **Given** the activity section, **When** I drag the resize handle up, **Then** the section grows
- [ ] **Given** I resize the activity section, **When** I restart VS Code, **Then** the height is preserved
- [ ] **Given** a stage-complete event, **When** I view it, **Then** it shows ✓ icon with green styling
- [ ] **Given** a bolt-start event, **When** I view it, **Then** it shows ▶ icon with blue styling
- [ ] **Given** an event from 2 hours ago, **When** I view it, **Then** time shows "2h ago"

## Technical Notes

- Activity data from artifact-parser `buildActivityFeed()`
- Filter state stored in component state (not persisted)
- Resize handle: CSS `cursor: ns-resize`, mouse events for drag
- Height persisted in workspaceState, min 120px, max 500px
- Relative time: Just now, Xm ago, Xh ago, Yesterday, Xd ago
- Icon classes: `stage-complete`, `bolt-start`, `bolt-complete`, `bolt-created`

## Dependencies

### Requires
- 007-command-center-bolts-tab
- artifact-parser/006-activity-feed-derivation

### Enables
- User can track project activity

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No activity events | Show "No activity" message |
| Filter shows no results | Show "No matching activity" |
| Very old events | Show date instead of relative |
| Resize below minimum | Clamp to 120px |
| Resize above maximum | Clamp to 500px |

## Out of Scope

- Clicking activity to navigate to bolt
- Activity notifications
- Real-time activity updates (only on refresh)
