---
id: bolt-artifact-parser-1
unit: artifact-parser
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 001-memory-bank-schema
  - 002-project-detection
  - 003-artifact-parsing
  - 004-frontmatter-parser
created: 2025-12-25T17:00:00Z
started: 2025-12-25T18:45:00Z
completed: 2025-12-25T19:15:00Z
current_stage: null
stages_completed:
  - name: spec
    completed: 2025-12-25T18:50:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T19:00:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T19:15:00Z
    artifact: test-walkthrough.md

requires_bolts: []
enables_bolts:
  - bolt-file-watcher-1
  - bolt-sidebar-provider-1
  - bolt-welcome-view-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 1
---

# Bolt: bolt-artifact-parser-1

## Overview

Foundation bolt that implements all artifact parsing functionality. This is the first bolt to execute as all other units depend on it.

## Objective

Implement the MemoryBankSchema class and all parsing functions for reading memory-bank artifacts and their statuses.

## Stories Included

- **001-memory-bank-schema**: Central path definitions class (Must)
- **002-project-detection**: Detect if workspace is specsmd project (Must)
- **003-artifact-parsing**: Parse intents, units, stories, bolts, standards (Must)
- **004-frontmatter-parser**: Extract YAML frontmatter and normalize status (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- None (foundation bolt)

### Enables
- bolt-file-watcher-1
- bolt-sidebar-provider-1
- bolt-welcome-view-1
- bolt-extension-core-1

## Success Criteria

- [ ] MemoryBankSchema class with all path methods
- [ ] detectProject() function working
- [ ] All artifact types parsed correctly
- [ ] Frontmatter parsing with status normalization
- [ ] Unit tests passing
- [ ] Handles malformed files gracefully

## Notes

- This bolt is critical path - all other bolts depend on it
- Design for future extension to dynamic schema loading
- Consider caching for performance optimization in future
