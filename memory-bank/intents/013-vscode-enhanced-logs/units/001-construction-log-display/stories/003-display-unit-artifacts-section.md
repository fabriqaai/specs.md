---
id: 003-display-unit-artifacts-section
unit: 001-construction-log-display
intent: 013-vscode-enhanced-logs
status: complete
priority: must
created: 2026-01-09T07:10:00.000Z
assigned_bolt: 017-construction-log-display
implemented: true
---

# Story: 003-display-unit-artifacts-section

## User Story

**As a** specsmd user
**I want** to see the unit's construction log in the completed bolt section
**So that** I can quickly access the execution history for that unit

## Acceptance Criteria

- [ ] **Given** a completed bolt with constructionLogPath set, **When** expanding the bolt, **Then** I see a "Unit Artifacts" section below "Artifacts"
- [ ] **Given** the Unit Artifacts section, **When** viewing it, **Then** I see "construction-log.md" as a clickable item
- [ ] **Given** the construction log item, **When** clicking it, **Then** the file opens in VS Code editor
- [ ] **Given** a completed bolt without constructionLogPath, **When** expanding the bolt, **Then** no "Unit Artifacts" section appears
- [ ] **Given** the construction log item, **When** viewing it, **Then** it shows a log/clipboard icon and "construction-log" type badge

## Technical Notes

- Modify `vs-code-extension/src/webview/components/bolts/completion-item.ts`
- Add new section similar to existing "Artifacts" section
- Use `open-file` event (existing mechanism) for file opening
- Icon suggestion: clipboard (📋) or scroll (📜)
- CompletedBoltData may need `constructionLogPath` added

## Dependencies

### Requires
- 002-resolve-construction-log-path (path must be resolved)

### Enables
- None (final story)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very long path | Truncate with ellipsis, full path in tooltip |
| File deleted after parse | Click shows VS Code "file not found" error |

## Out of Scope

- Inline preview of construction log
- Multiple unit artifacts (only construction log for now)
