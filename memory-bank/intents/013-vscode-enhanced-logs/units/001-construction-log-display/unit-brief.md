---
unit: 001-construction-log-display
intent: 013-vscode-enhanced-logs
phase: inception
status: complete
created: 2026-01-09T07:05:00.000Z
updated: 2026-01-09T07:05:00.000Z
unit_type: frontend
bolt_type: simple-construction-bolt
---

# Unit Brief: Construction Log Display

## Purpose

Add construction log file access to the completed bolt section in the VS Code extension. Users expanding a completed bolt will see the unit's construction-log.md as a clickable link under "Unit Artifacts".

## Scope

### In Scope
- Resolving construction log path from bolt's unit/intent fields
- Adding constructionLogPath field to Bolt type
- Displaying "Unit Artifacts" section in completion-item component
- Handling missing construction log gracefully

### Out of Scope
- Creating or editing construction logs
- Parsing construction log content
- Displaying construction log inline (just links to file)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Construction log path resolution | Must |
| FR-2 | Unit Artifacts section in completed bolt | Must |
| FR-3 | Graceful handling when log doesn't exist | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| Bolt | Construction session | id, unit, intent, constructionLogPath |
| CompletedBoltData | UI model for completed bolt | files[], unitArtifacts[] |
| ArtifactFileData | File link data | name, path, type |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| resolveConstructionLogPath | Build path from bolt fields | bolt.unit, bolt.intent | string or null |
| checkFileExists | Verify file exists | path | boolean |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 3 |
| Must Have | 3 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Add constructionLogPath to Bolt type | Must | Planned |
| 002 | Resolve construction log path in parser | Must | Planned |
| 003 | Display Unit Artifacts section in completion-item | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| 011-vscode-extension (extension-core) | Existing extension infrastructure |
| 011-vscode-extension (artifact-parser) | Existing parser to extend |

### Depended By
None

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| VS Code Extension API | File opening | Low |

---

## Technical Context

### Suggested Technology
- TypeScript (existing extension codebase)
- Lit (existing webview components)

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| artifactParser.ts | Code | Import/Extend |
| completion-item.ts | Code | Import/Extend |
| types.ts | Code | Type Extension |

### Data Storage
None - file path resolution only

---

## Constraints

- Must follow existing completion-item.ts patterns
- Must use existing open-file event mechanism
- No new dependencies

---

## Success Criteria

### Functional
- [ ] Completed bolts show "Unit Artifacts" section when construction log exists
- [ ] Clicking construction log opens file in editor
- [ ] Section hidden when construction log doesn't exist

### Non-Functional
- [ ] Path resolution < 1ms per bolt
- [ ] No visual layout issues in sidebar

### Quality
- [ ] Unit tests for path resolution
- [ ] Manual testing with real memory-bank

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-construction-log-display-1 | simple | 001, 002, 003 | All changes in one bolt |

---

## Notes

This is a small, focused enhancement. Single bolt covering all three stories is appropriate.
