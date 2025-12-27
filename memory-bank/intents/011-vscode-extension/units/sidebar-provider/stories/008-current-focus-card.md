---
id: vscode-extension-story-sp-008
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Current Focus Card

## User Story

**As a** user
**I want** an expandable card showing my active bolt's detailed progress
**So that** I can see exactly where I am in the current work

## Acceptance Criteria

- [ ] **Given** an active bolt, **When** I view Current Focus, **Then** I see bolt name and type badge
- [ ] **Given** the focus card header, **When** I view it, **Then** I see current stage name and "In Progress" badge
- [ ] **Given** I click the focus card header, **When** expanded, **Then** I see detailed progress content
- [ ] **Given** the card is expanded, **When** I view it, **Then** I see a progress ring with percentage
- [ ] **Given** the card is expanded, **When** I view it, **Then** I see stage pipeline (M-D-A-I-T or P-I-T)
- [ ] **Given** the stage pipeline, **When** I view it, **Then** complete stages show ✓, active shows highlight, pending shows ○
- [ ] **Given** the card is expanded, **When** I view it, **Then** I see stories checklist with completion status
- [ ] **Given** the card is expanded, **When** I view it, **Then** I see "Continue" and "Files" action buttons
- [ ] **Given** I click "Continue", **When** clicked, **Then** it shows a toast "Opening workspace..."

## Technical Notes

- Progress ring: SVG circle with stroke-dasharray animation
- Stage pipeline: DDD = Model, Design, ADR, Implement, Test; Simple = Plan, Implement, Test
- Expand/collapse state persisted in workspaceState
- Stories show checkbox icon (checked for complete)
- Buttons use VS Code button styling

## Dependencies

### Requires
- 007-command-center-bolts-tab
- artifact-parser (bolt with stages, stories)

### Enables
- User can see detailed bolt progress

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bolt with no stories | Hide stories section |
| All stages complete | Show 100% progress, all ✓ |
| Unknown bolt type | Show stages as-is from frontmatter |
| Long bolt name | Truncate with ellipsis |

## Out of Scope

- Actually opening files (button is placeholder)
- Editing bolt from card
- Stage advancement from UI
