---
id: bolt-file-watcher-1
unit: file-watcher
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 001-file-system-watcher
  - 002-debounced-refresh
created: 2025-12-25T17:00:00Z
started: 2025-12-25T19:30:00Z
completed: 2025-12-25T19:40:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-25T19:30:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T19:35:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T19:40:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-artifact-parser-1
enables_bolts:
  - bolt-sidebar-provider-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 1
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-file-watcher-1

## Overview

Implement file system watching for the memory-bank directory with debounced change handling.

## Objective

Create a file watcher that detects changes in memory-bank and triggers tree refresh with debouncing to prevent UI flicker.

## Stories Included

- **001-file-system-watcher**: Setup FileSystemWatcher for memory-bank/**/*.md (Must)
- **002-debounced-refresh**: Debounce rapid changes with 100ms delay (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- bolt-artifact-parser-1 (needs MemoryBankSchema for paths)

### Enables
- bolt-sidebar-provider-1 (needs refresh events)

## Success Criteria

- [ ] FileSystemWatcher created on activation
- [ ] Detects file create, modify, delete
- [ ] Debounces rapid changes (100ms)
- [ ] Properly disposes on deactivation
- [ ] Unit tests with mock events
- [ ] Integration test with real files

## Notes

- Use VS Code's native FileSystemWatcher for cross-platform support
- Glob pattern: `**/memory-bank/**/*.md`
- Store watcher in ExtensionContext.subscriptions for cleanup
