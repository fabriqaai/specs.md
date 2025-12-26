---
id: bolt-webview-lit-migration-4
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: planned
stories:
  - 026-specs-view-components
  - 027-overview-view-components
created: 2025-12-26T19:00:00Z
started: null
completed: null
current_stage: null
stages_completed: []

requires_bolts:
  - bolt-webview-lit-migration-3
enables_bolts:
  - bolt-webview-lit-migration-5
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-webview-lit-migration-4

## Overview

View components bolt that migrates the Specs and Overview views to Lit components. This completes all three tab views with proper tree navigation, search, quick actions, and resources.

## Objective

Create Lit components for the Specs tree view with search/filter and the Overview dashboard with project summary, quick actions, resources, and getting started sections.

## Stories Included

- **026-specs-view-components**: Specs tree view with search, expand/collapse, file opening (Must)
- **027-overview-view-components**: Overview dashboard with summary, actions, resources, getting started (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Plan**: Pending → implementation-plan.md
- [ ] **2. Implement**: Pending → implementation-walkthrough.md
- [ ] **3. Test**: Pending → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-3 (Bolts view pattern to follow)

### Enables
- bolt-webview-lit-migration-5 (all views ready for state context)

## Success Criteria

### Specs View
- [ ] `<specs-view>` shows tree structure with search
- [ ] `<spec-tree-item>` recursive component for tree nodes
- [ ] `<search-input>` filters tree in real-time
- [ ] Folder expand/collapse with icons
- [ ] File click opens in VS Code editor
- [ ] `<empty-state>` for no results

### Overview View
- [ ] `<overview-view>` container with all sections
- [ ] `<project-summary>` shows name and stats
- [ ] `<quick-actions>` grid of action buttons
- [ ] `<resource-list>` links to docs and external resources
- [ ] `<getting-started>` numbered steps for new projects
- [ ] Actions dispatch VS Code commands

## Notes

- Specs tree uses recursive component pattern
- Search debouncing for performance
- Quick actions map to VS Code command IDs
- Getting started shows conditionally for new projects
