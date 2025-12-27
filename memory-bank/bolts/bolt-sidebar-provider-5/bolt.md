---
id: bolt-sidebar-provider-5
unit: sidebar-provider
intent: 011-vscode-extension
type: simple-construction-bolt
status: in-progress
stories:
  - 011-filewatcher-statestore-integration
  - 012-next-actions-ui
  - 013-start-bolt-action
  - 014-intent-selection-strategies
  - 015-persist-expanded-state
  - 016-bolt-filtering
  - 017-activity-open-button
  - 018-specs-view
  - 019-overview-view
created: 2025-12-26T18:00:00Z
started: 2025-12-26T18:00:00Z
completed: null
current_stage: implement
stages_completed:
  - plan

requires_bolts:
  - bolt-sidebar-provider-4
  - bolt-artifact-parser-2
enables_bolts: []
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 2
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: bolt-sidebar-provider-5

## Overview

Fifth sidebar-provider bolt that integrates StateStore with FileWatcher, adds Next Actions UI, Start Bolt action, intent selection strategies, expanded state persistence, and bolt filtering.

## Objective

Complete the StateStore integration by wiring FileWatcher to auto-refresh, displaying computed next actions in the UI, enabling bolt lifecycle actions, adding smart intent selection, persisting UI state, and implementing bolt filtering.

## Stories Included

- **011-filewatcher-statestore-integration**: Wire FileWatcher → StateStore for auto-refresh (Must)
- **012-next-actions-ui**: Display suggested actions in Overview tab (Must)
- **013-start-bolt-action**: Enable starting bolts from UI (Should)
- **014-intent-selection-strategies**: Additional intent selection logic (Could)
- **015-persist-expanded-state**: Persist expanded intents/units (Should)
- **016-bolt-filtering**: Filter bolts by intent/status/type (Should)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-sidebar-provider-4 (webview UI in place)
- bolt-artifact-parser-2 (parsing infrastructure)

### Enables
- None (enhances existing functionality)

## Success Criteria

- [ ] FileWatcher changes trigger StateStore.loadFromModel()
- [ ] UI auto-refreshes on file changes without manual action
- [ ] Next Actions section displays in Overview tab
- [ ] Start Bolt button works for draft bolts
- [ ] Intent selection uses multiple strategies with priority
- [ ] Expanded state persists across sessions
- [ ] Bolt filtering works by intent/status/type
- [ ] All tests pass
- [ ] No regressions in existing functionality

## Notes

- StateStore infrastructure already exists in `src/state/`
- FileWatcher already has debouncing built-in
- Must connect the dots: FileWatcher → Parser → StateStore → WebviewProvider
