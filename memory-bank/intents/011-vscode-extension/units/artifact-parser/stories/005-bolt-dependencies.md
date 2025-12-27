---
id: vscode-extension-story-ap-005
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-26
assigned_bolt: null
implemented: false
---

# Story: Bolt Dependency Parsing

## User Story

**As a** extension developer
**I want** the parser to read and compute bolt dependencies
**So that** the UI can display dependency-ordered queues and blocked bolt indicators

## Acceptance Criteria

- [ ] **Given** a bolt with `requires_bolts: [bolt-a, bolt-b]`, **When** parsed, **Then** bolt.requiresBolts equals `['bolt-a', 'bolt-b']`
- [ ] **Given** a bolt with `enables_bolts: [bolt-c]`, **When** parsed, **Then** bolt.enablesBolts equals `['bolt-c']`
- [ ] **Given** a pending bolt where all requires_bolts are complete, **When** computed, **Then** bolt.isBlocked equals `false`
- [ ] **Given** a pending bolt where some requires_bolts are incomplete, **When** computed, **Then** bolt.isBlocked equals `true`
- [ ] **Given** a blocked bolt, **When** computed, **Then** bolt.blockedBy contains IDs of incomplete required bolts
- [ ] **Given** a bolt that enables 3 other bolts, **When** computed, **Then** bolt.unblocksCount equals `3`
- [ ] **Given** a bolt with no requires_bolts, **When** computed, **Then** bolt.isBlocked equals `false`

## Technical Notes

- Add `requiresBolts`, `enablesBolts`, `isBlocked`, `blockedBy`, `unblocksCount` to Bolt interface
- Dependency computation requires access to all bolts (pass full bolt list)
- Use O(n) algorithm for computing unblocksCount
- Handle missing/malformed dependency fields gracefully (treat as empty array)

## Dependencies

### Requires
- 003-artifact-parsing (bolt parsing)
- 004-frontmatter-parser

### Enables
- sidebar-provider/009-up-next-queue

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Circular dependencies | Detect and mark both as blocked |
| Non-existent bolt in requires_bolts | Treat as incomplete (blocked) |
| Empty requires_bolts array | Not blocked |
| Missing requires_bolts field | Treat as empty (not blocked) |

## Out of Scope

- Dependency cycle detection warning UI
- Auto-reordering of bolts based on dependencies
