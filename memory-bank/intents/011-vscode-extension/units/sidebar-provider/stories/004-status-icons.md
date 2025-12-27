---
id: vscode-extension-story-sp-004
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Status Icons and Badges

## User Story

**As a** developer
**I want** to see visual status indicators on all artifacts
**So that** I can quickly understand project progress

## Acceptance Criteria

- [ ] **Given** status Draft/Pending, **When** getStatusIcon() called, **Then** return gray circle icon
- [ ] **Given** status InProgress, **When** getStatusIcon() called, **Then** return yellow spinner/loading icon
- [ ] **Given** status Complete/Done, **When** getStatusIcon() called, **Then** return green checkmark icon
- [ ] **Given** status Unknown (invalid frontmatter), **When** getStatusIcon() called, **Then** return yellow "?" icon
- [ ] **Given** unknown status with "?" icon, **When** user hovers, **Then** tooltip shows "Invalid or missing status in frontmatter"
- [ ] **Given** any TreeItem, **When** rendered, **Then** icon matches VS Code theme (light/dark)

## Technical Notes

- Use vscode.ThemeIcon for theme compatibility
- Icons: $(circle-outline), $(sync~spin), $(check), $(question)
- Colors: Use ThemeColor or codicon colors
- Tooltip set via TreeItem.tooltip

## Dependencies

### Requires
- artifact-parser/004-frontmatter-parser (for status)

### Enables
- Visual progress tracking

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Light theme | Icons visible and appropriate |
| Dark theme | Icons visible and appropriate |
| High contrast theme | Icons accessible |

## Out of Scope

- Custom icon images
- Animated icons (VS Code limitation)
