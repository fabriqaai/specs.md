---
id: bolt-extension-core-1
unit: extension-core
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 001-extension-activation
  - 002-command-registration
  - 003-file-operation-commands
created: 2025-12-25T17:00:00Z
started: 2025-12-25T22:30:00Z
completed: 2025-12-25T22:50:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-25T22:30:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T22:45:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T22:50:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-artifact-parser-1
  - bolt-file-watcher-1
  - bolt-sidebar-provider-1
  - bolt-sidebar-provider-2
  - bolt-welcome-view-1
enables_bolts: []
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 3
  testing_scope: 2
---

# Bolt: bolt-extension-core-1

## Overview

Final bolt that wires everything together - extension activation, command registration, and file operations.

## Objective

Create the extension entry point that initializes all units, registers commands, and handles file operations.

## Stories Included

- **001-extension-activation**: activate/deactivate, view registration, icon setup (Must)
- **002-command-registration**: Register all commands including refresh (Must)
- **003-file-operation-commands**: Double-click open, reveal in explorer, copy path (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- bolt-artifact-parser-1 (core parsing)
- bolt-file-watcher-1 (file watching)
- bolt-sidebar-provider-1 (tree provider)
- bolt-sidebar-provider-2 (complete tree)
- bolt-welcome-view-1 (welcome view)

### Enables
- None (final bolt - enables deployment)

## Success Criteria

- [ ] Extension activates without errors
- [ ] Activity bar icon visible (favicon.png)
- [ ] Sidebar shows correct view (welcome or tree)
- [ ] Refresh command works
- [ ] Double-click opens files
- [ ] Reveal in Explorer works
- [ ] Copy Path works
- [ ] Clean deactivation (no memory leaks)
- [ ] Integration tests passing

## Notes

- This is the orchestration bolt - depends on all others
- Create package.json contributions (viewsContainers, views, commands, menus)
- Use context.subscriptions for all disposables
- Test with both specsmd and non-specsmd workspaces
