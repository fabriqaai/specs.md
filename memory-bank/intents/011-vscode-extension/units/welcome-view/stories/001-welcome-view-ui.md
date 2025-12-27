---
id: vscode-extension-story-wv-001
unit: welcome-view
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Welcome View UI

## User Story

**As a** VS Code user opening a non-specsmd workspace
**I want** to see a welcoming onboarding view
**So that** I understand what specsmd is and how to install it

## Acceptance Criteria

- [ ] **Given** no specsmd project detected, **When** sidebar activates, **Then** welcome view is shown instead of tree
- [ ] **Given** welcome view, **When** rendered, **Then** specs.md pixel logo is displayed prominently
- [ ] **Given** pixel logo, **When** clicked, **Then** https://specs.md opens in browser
- [ ] **Given** welcome view, **When** rendered, **Then** brief explanation text is shown
- [ ] **Given** welcome view, **When** rendered, **Then** copyable command box shows `npx specsmd@latest install`
- [ ] **Given** command box, **When** copy icon clicked, **Then** command is copied to clipboard
- [ ] **Given** welcome view, **When** rendered, **Then** "Install specsmd" button is visible

## Technical Notes

- Use WebviewViewProvider for custom HTML/CSS rendering
- Bundle pixel logo with extension (don't load from remote)
- Use VS Code's when clause to toggle between welcome and tree view
- Copy functionality via postMessage to extension host

## Dependencies

### Requires
- artifact-parser/002-project-detection

### Enables
- 002-install-button-flow

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Light theme | UI looks good |
| Dark theme | UI looks good |
| Narrow sidebar | Responsive layout |
| Screen reader | Accessible labels |

## Out of Scope

- Multiple language support
- Animated onboarding
