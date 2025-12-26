---
id: bolt-webview-lit-migration-3
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: planned
stories:
  - 025-bolts-view-components
created: 2025-12-26T19:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []

requires_bolts:
  - bolt-webview-lit-migration-2
enables_bolts:
  - bolt-webview-lit-migration-4
requires_units: []
blocks: false

complexity:
  avg_complexity: 3
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-webview-lit-migration-3

## Overview

Largest component bolt that migrates the entire Bolts view to Lit components. This includes the mission status header, focus card with progress ring, queue section, and activity feed with filtering.

## Objective

Create a complete set of Lit components for the Bolts view that replaces the current inline HTML template strings, with proper event handling and VS Code integration.

## Stories Included

- **025-bolts-view-components**: Full Bolts view with mission status, focus card, queue, activity feed (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-2 (Lit scaffold and app component)

### Enables
- bolt-webview-lit-migration-4 (pattern for remaining views)

## Success Criteria

- [ ] `<bolts-view>` container component renders all sections
- [ ] `<mission-status>` shows current intent with statistics
- [ ] `<focus-card>` expands/collapses with animation
- [ ] `<progress-ring>` SVG renders progress correctly
- [ ] `<stage-pipeline>` shows stage status indicators
- [ ] `<queue-section>` lists pending bolts with priority
- [ ] `<queue-item>` shows Start button with command popup
- [ ] `<activity-feed>` displays events with filtering
- [ ] `<activity-item>` clickable to open files
- [ ] All components use VS Code theme colors

## Notes

- This is the largest story with 9 component files
- Shared components (progress-ring, stage-pipeline) will be reused
- Event delegation pattern for activity item clicks
- Design reference: `vs-code-extension/design-mockups/variation-8-2.html`
