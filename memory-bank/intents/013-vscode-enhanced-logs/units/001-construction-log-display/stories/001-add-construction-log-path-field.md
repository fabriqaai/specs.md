---
id: 001-add-construction-log-path-field
unit: 001-construction-log-display
intent: 013-vscode-enhanced-logs
status: complete
priority: must
created: 2026-01-09T07:10:00.000Z
assigned_bolt: 017-construction-log-display
implemented: true
---

# Story: 001-add-construction-log-path-field

## User Story

**As a** VS Code extension developer
**I want** the Bolt type to include a constructionLogPath field
**So that** the UI can access the unit's construction log file

## Acceptance Criteria

- [ ] **Given** the Bolt interface in types.ts, **When** reviewing the type definition, **Then** it includes `constructionLogPath?: string` as an optional field
- [ ] **Given** a bolt with valid unit and intent, **When** parsed, **Then** constructionLogPath contains the resolved path
- [ ] **Given** a bolt where construction log doesn't exist, **When** parsed, **Then** constructionLogPath is undefined

## Technical Notes

- Add to `vs-code-extension/src/parser/types.ts`
- Field is optional (undefined when file doesn't exist)
- Path format: `memory-bank/intents/{intent}/units/{unit}/construction-log.md`

## Dependencies

### Requires
- None (type definition change)

### Enables
- 002-resolve-construction-log-path (path resolution logic)
- 003-display-unit-artifacts-section (UI display)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Bolt missing unit field | constructionLogPath is undefined |
| Bolt missing intent field | constructionLogPath is undefined |

## Out of Scope

- Path resolution logic (story 002)
- UI display (story 003)
