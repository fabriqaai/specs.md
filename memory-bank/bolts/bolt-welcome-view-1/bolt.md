---
id: bolt-welcome-view-1
unit: welcome-view
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 001-welcome-view-ui
  - 002-install-button-flow
  - 003-post-installation-detection
created: 2025-12-25T17:00:00Z
started: 2025-12-25T22:00:00Z
completed: 2025-12-25T22:15:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-25T22:00:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-25T22:10:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-25T22:15:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-artifact-parser-1
  - bolt-file-watcher-1
enables_bolts:
  - bolt-extension-core-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: bolt-welcome-view-1

## Overview

Implement the welcome/onboarding view for non-specsmd workspaces with installation flow.

## Objective

Create an engaging welcome view that explains specsmd and provides easy installation via terminal command.

## Stories Included

- **001-welcome-view-ui**: Welcome view with logo, explanation, copyable command (Must)
- **002-install-button-flow**: Install button → confirmation → terminal with command (Must)
- **003-post-installation-detection**: Auto-switch to tree when folders appear (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Pending → spec.md
- [ ] **2. Implement**: Pending → src/
- [ ] **3. Test**: Pending → test-report.md

## Dependencies

### Requires
- bolt-artifact-parser-1 (needs detectProject())
- bolt-file-watcher-1 (needs change events for post-install detection)

### Enables
- bolt-extension-core-1 (welcome view ready for registration)

## Success Criteria

- [ ] Welcome view shows when no project detected
- [ ] Pixel logo clickable → specs.md website
- [ ] Copy button copies command to clipboard
- [ ] Install button shows confirmation
- [ ] Terminal opens with command pasted (not auto-executed)
- [ ] Auto-switches to tree after installation
- [ ] Looks good in light and dark themes

## Notes

- Use WebviewViewProvider for custom HTML rendering
- Bundle logo with extension
- Use VS Code `when` clause for view switching
- Terminal command: `npx specsmd@latest install`
