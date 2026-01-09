---
id: 017-construction-log-display
unit: 001-construction-log-display
intent: 013-vscode-enhanced-logs
type: simple-construction-bolt
status: complete
stories:
  - 001-add-construction-log-path-field
  - 002-resolve-construction-log-path
  - 003-display-unit-artifacts-section
created: 2026-01-09T07:15:00.000Z
started: 2026-01-09T12:30:00.000Z
completed: "2026-01-09T10:40:36Z"
current_stage: null
stages_completed:
  - name: plan
    completed: 2026-01-09T12:40:00.000Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2026-01-09T12:55:00.000Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2026-01-09T13:05:00.000Z
    artifact: test-walkthrough.md
requires_bolts: []
enables_bolts: []
requires_units: []
blocks: false
complexity:
  avg_complexity: 1
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 1
---

# Bolt: 017-construction-log-display

## Overview

Add construction log file access to the VS Code extension's completed bolt section. This bolt implements all three stories in a single pass since they are tightly coupled changes across parser types, parser logic, and UI.

## Objective

Enable users to access unit construction logs directly from the completed bolt view by adding a "Unit Artifacts" section that links to the construction-log.md file.

## Stories Included

- **001-add-construction-log-path-field**: Add constructionLogPath field to Bolt type (Must)
- **002-resolve-construction-log-path**: Resolve path in parser from bolt's unit/intent (Must)
- **003-display-unit-artifacts-section**: Display Unit Artifacts section in completion-item (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Create implementation plan
- [ ] **2. Implement**: Add type field, parser logic, UI section
- [ ] **3. Test**: Verify functionality with real memory-bank

## Dependencies

### Requires
- None (standalone enhancement)

### Enables
- None

## Files to Modify

```
vs-code-extension/src/
├── parser/
│   ├── types.ts              # Add constructionLogPath to Bolt interface
│   └── artifactParser.ts     # Resolve path in parseBolt()
└── webview/components/bolts/
    └── completion-item.ts    # Add Unit Artifacts section
```

## Success Criteria

- [ ] Bolt type includes constructionLogPath field
- [ ] Path resolved correctly from bolt's unit and intent
- [ ] File existence checked before setting path
- [ ] UI shows "Unit Artifacts" section when path exists
- [ ] Clicking construction log opens file in editor
- [ ] No section shown when construction log missing

## Notes

- Small, focused enhancement - single bolt appropriate
- Follow existing patterns in completion-item.ts
- Use existing open-file event mechanism
