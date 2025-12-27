---
id: vscode-extension-story-sp-003
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Bolt Tree with Stages and Stories

## User Story

**As a** developer
**I want** to see bolts with their stages and stories
**So that** I can track construction progress at a glance

## Acceptance Criteria

- [ ] **Given** Bolts section expanded, **When** getChildren() called, **Then** return bolts sorted by in-progress first, then by number
- [ ] **Given** a Bolt node, **When** rendered as TreeItem, **Then** show "{name} [{type}] Stage: {currentStage}" with status icon
- [ ] **Given** a Bolt node expanded, **When** getChildren() called, **Then** return "Stages" and "Stories" section nodes
- [ ] **Given** Stages section expanded, **When** getChildren() called, **Then** return all bolt stages with individual status icons
- [ ] **Given** Stories section expanded, **When** getChildren() called, **Then** return stories assigned to this bolt
- [ ] **Given** bolt type "ddd-construction-bolt", **When** rendered, **Then** show badge "DDD"
- [ ] **Given** bolt type "simple-construction-bolt", **When** rendered, **Then** show badge "Simple"

## Technical Notes

- Bolt type badge can be shown in TreeItem.description
- Stages and Stories sections should have different icons for visual differentiation
- Current stage should be highlighted (different icon color)

## Dependencies

### Requires
- 001-tree-data-provider
- artifact-parser/003-artifact-parsing

### Enables
- Construction progress tracking

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bolt with no stages | Show bolt, Stages section empty |
| Bolt with no stories | Show bolt, Stories section empty |
| All stages complete | Show all green checkmarks |

## Out of Scope

- Bolt execution from tree
- Stage artifact viewing
