---
id: 002-resolve-construction-log-path
unit: 001-construction-log-display
intent: 013-vscode-enhanced-logs
status: complete
priority: must
created: 2026-01-09T07:10:00.000Z
assigned_bolt: 017-construction-log-display
implemented: true
---

# Story: 002-resolve-construction-log-path

## User Story

**As a** VS Code extension
**I want** to resolve the construction log path from bolt's unit and intent fields
**So that** completed bolts can link to their unit's construction log

## Acceptance Criteria

- [ ] **Given** a bolt with unit="001-analytics-tracker" and intent="007-installer-analytics", **When** parsed, **Then** constructionLogPath equals "memory-bank/intents/007-installer-analytics/units/001-analytics-tracker/construction-log.md"
- [ ] **Given** the resolved path points to an existing file, **When** parsed, **Then** constructionLogPath is set
- [ ] **Given** the resolved path points to a non-existent file, **When** parsed, **Then** constructionLogPath is undefined
- [ ] **Given** bolt.unit is empty, **When** parsed, **Then** constructionLogPath is undefined

## Technical Notes

- Modify `vs-code-extension/src/parser/artifactParser.ts` in `parseBolt()` function
- Use `fs.existsSync()` or async equivalent to check file existence
- Path resolution: `memory-bank/intents/${intent}/units/${unit}/construction-log.md`
- Use workspace path as base for absolute path

## Dependencies

### Requires
- 001-add-construction-log-path-field (type must exist first)

### Enables
- 003-display-unit-artifacts-section (UI needs the path)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Intent folder name different from frontmatter | Use frontmatter value (existing behavior) |
| Unit folder doesn't exist | constructionLogPath undefined |
| File permissions error | Treat as non-existent, undefined |

## Out of Scope

- Parsing construction log content
- Caching file existence checks
