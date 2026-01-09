---
intent: 013-vscode-enhanced-logs
phase: inception
status: complete
created: 2026-01-09T07:00:00.000Z
updated: 2026-01-09T07:00:00.000Z
---

# Requirements: VS Code Enhanced Logs

## Intent Overview

Add construction log access to the VS Code extension's completed bolt section. When users expand a completed bolt, they should see the unit's construction log file (`construction-log.md`) listed as a "Unit Artifacts" item alongside the existing bolt artifacts.

**Scope**: Enhancement to existing `011-vscode-extension`
**Location**: `vs-code-extension/` folder

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Enable access to construction logs from completed bolts | Users can click to open construction-log.md from completed bolt view | Must |
| Provide unit-level context for completed work | Construction log link visible in completed bolt expansion | Must |

---

## Functional Requirements

### FR-1: Construction Log Path Resolution

- FR-1.1: Parser SHALL resolve construction log path from bolt's unit and intent fields
- FR-1.2: Path formula: `memory-bank/intents/{intent}/units/{unit}/construction-log.md`
- FR-1.3: Parser SHALL add `constructionLogPath` field to Bolt type
- FR-1.4: Parser SHALL verify file exists before setting path (graceful handling if missing)

### FR-2: Unit Artifacts Section in Completed Bolt

- FR-2.1: Completed bolt expansion SHALL show "Unit Artifacts" section below "Artifacts"
- FR-2.2: Unit Artifacts section SHALL display construction log as clickable file link
- FR-2.3: Construction log link SHALL use distinct icon (e.g., clipboard/log icon)
- FR-2.4: File type label SHALL show "construction-log"
- FR-2.5: Clicking SHALL open the file in VS Code editor (same as other artifacts)

### FR-3: Graceful Handling

- FR-3.1: If construction log doesn't exist, Unit Artifacts section SHALL NOT display
- FR-3.2: Extension SHALL NOT show error if construction log is missing

---

## Non-Functional Requirements

### Performance

| Requirement | Metric | Target |
|-------------|--------|--------|
| Path resolution | Per bolt | < 1ms (simple string concatenation + file check) |

### Usability

| Requirement | Description |
|-------------|-------------|
| Consistency | Follow existing artifact display patterns |
| Discoverability | Unit artifacts visually differentiated from bolt artifacts |

---

## Constraints

### Technical Constraints

- Must work within existing `completion-item.ts` component architecture
- Must use existing file opening mechanism (`open-file` event)

### Business Constraints

- Minimal change to existing UI (additive, not restructuring)

---

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| Bolt has valid `unit` and `intent` fields | Path cannot be resolved | Skip construction log display |
| Construction log follows standard path convention | File not found | Verify file exists before displaying |

---

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| None | - | - | - |
