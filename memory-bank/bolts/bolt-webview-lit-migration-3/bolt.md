---
id: bolt-webview-lit-migration-3
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 025-bolts-view-components
created: 2025-12-26T19:00:00Z
started: 2025-12-26T21:20:00Z
completed: 2025-12-26T22:30:00Z
current_stage: null
stages_completed:
  - plan: 2025-12-26T21:30:00Z
  - implement: 2025-12-26T22:20:00Z
  - test: 2025-12-26T22:30:00Z

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

- [x] **1. Plan**: Complete → implementation-plan.md
- [x] **2. Implement**: Complete → implementation-walkthrough.md
- [x] **3. Test**: Complete → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-2 (Lit scaffold and app component)

### Enables
- bolt-webview-lit-migration-4 (pattern for remaining views)

## Success Criteria

- [x] `<bolts-view>` container component renders all sections
- [x] `<mission-status>` shows current intent with statistics
- [x] `<focus-card>` expands/collapses with animation
- [x] `<progress-ring>` SVG renders progress correctly
- [x] `<stage-pipeline>` shows stage status indicators
- [x] `<queue-section>` lists pending bolts with priority
- [x] `<queue-item>` shows Start button with command popup
- [x] `<activity-feed>` displays events with filtering
- [x] `<activity-item>` clickable to open files
- [x] All components use VS Code theme colors

## Notes

- This is the largest story with 9 component files
- Shared components (progress-ring, stage-pipeline) will be reused
- Event delegation pattern for activity item clicks
- Design reference: `vs-code-extension/design-mockups/variation-8-2.html`
