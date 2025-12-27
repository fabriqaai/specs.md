---
id: vscode-extension-story-sp-005
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: should
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Pixel Logo Footer

## User Story

**As a** developer
**I want** to see the specs.md pixel logo at the bottom of the sidebar
**So that** I have brand recognition and quick access to the website

## Acceptance Criteria

- [ ] **Given** tree view is rendered, **When** sidebar loads, **Then** pixel logo appears at bottom with fadeout effect
- [ ] **Given** pixel logo is displayed, **When** user clicks it, **Then** specs.md website opens in browser
- [ ] **Given** different tree heights, **When** sidebar renders, **Then** logo stays at bottom (sticky or after content)
- [ ] **Given** light theme, **When** logo renders, **Then** logo is visible and looks good
- [ ] **Given** dark theme, **When** logo renders, **Then** logo is visible and looks good

## Technical Notes

- May require WebviewView for custom rendering
- Alternative: Use TreeView's `message` property or description
- Logo file: bundled from `src/logo.png`
- Use vscode.env.openExternal for website link
- Fadeout effect via CSS gradient or opacity

## Dependencies

### Requires
- 001-tree-data-provider

### Enables
- Brand presence, website access

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very short tree | Logo still visible |
| Very long tree | Logo at bottom, scrollable |
| Sidebar resized narrow | Logo scales or hides gracefully |

## Out of Scope

- Animated logo
- Different logos per theme
