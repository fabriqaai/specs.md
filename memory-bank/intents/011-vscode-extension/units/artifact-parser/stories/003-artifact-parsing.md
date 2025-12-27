---
id: vscode-extension-story-ap-003
unit: artifact-parser
intent: 011-vscode-extension
status: draft
priority: must
created: 2025-12-25
assigned_bolt: null
implemented: false
---

# Story: Artifact Parsing

## User Story

**As a** sidebar-provider component
**I want** to get a complete model of all memory-bank artifacts
**So that** I can render them in the tree view

## Acceptance Criteria

- [ ] **Given** a memory-bank with intents, **When** scanMemoryBank() is called, **Then** return array of Intent objects with name, number, status
- [ ] **Given** an intent with units, **When** parseIntent() is called, **Then** return Intent with nested Unit objects
- [ ] **Given** a unit with stories, **When** parseUnit() is called, **Then** return Unit with nested Story objects
- [ ] **Given** bolts in memory-bank/bolts/, **When** scanMemoryBank() is called, **Then** return array of Bolt objects with id, type, status, stages, stories
- [ ] **Given** standards in memory-bank/standards/, **When** scanMemoryBank() is called, **Then** return array of Standard objects
- [ ] **Given** a bolt with stages completed, **When** parseBolt() is called, **Then** return Bolt with stages array and currentStage

## Technical Notes

- Use MemoryBankSchema for all paths
- Parse frontmatter using 004-frontmatter-parser
- Create TypeScript interfaces: Intent, Unit, Story, Bolt, Stage, Standard
- Handle missing folders gracefully (empty arrays)

## Dependencies

### Requires
- 001-memory-bank-schema
- 004-frontmatter-parser

### Enables
- sidebar-provider/002-intent-unit-story-tree

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty intents folder | Return empty array |
| Intent without units folder | Return intent with empty units array |
| Malformed folder names | Skip folder, log warning |
| Very deep nesting | Handle up to defined depth |

## Out of Scope

- Caching (future optimization)
- Incremental parsing (future optimization)
