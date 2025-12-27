---
id: vscode-extension-story-sp-002
unit: sidebar-provider
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Intent/Unit/Story Tree

## User Story

**As a** developer
**I want** to see intents, units, and stories in a nested tree structure
**So that** I can navigate my project's feature hierarchy

## Acceptance Criteria

- [ ] **Given** Intents section expanded, **When** getChildren() called, **Then** return all intents sorted by number prefix (001, 002...)
- [ ] **Given** an Intent node, **When** getChildren() called, **Then** return its units
- [ ] **Given** a Unit node, **When** getChildren() called, **Then** return its stories
- [ ] **Given** an Intent, **When** rendered as TreeItem, **Then** show format "{number}-{name}" with status icon
- [ ] **Given** a Unit, **When** rendered as TreeItem, **Then** show name with completion status icon
- [ ] **Given** a Story, **When** rendered as TreeItem, **Then** show "{number}-{title}" with status icon

## Technical Notes

- Intent collapsibleState: Collapsed by default
- Unit collapsibleState: Collapsed by default
- Story collapsibleState: None (leaf node)
- Sort intents by numeric prefix extraction

## Dependencies

### Requires
- 001-tree-data-provider
- artifact-parser/003-artifact-parsing

### Enables
- User navigation

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Intent with no units | Show intent, empty when expanded |
| Unit with no stories | Show unit, empty when expanded |
| 100+ intents | All rendered (virtualized by VS Code) |

## Out of Scope

- Filtering intents
- Search within tree
