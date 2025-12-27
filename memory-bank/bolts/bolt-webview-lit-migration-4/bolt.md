---
id: bolt-webview-lit-migration-4
unit: webview-lit-migration
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 026-specs-view-components
  - 027-overview-view-components
created: 2025-12-26T19:00:00Z
started: 2025-12-26T22:45:00Z
completed: 2025-12-26T23:00:00Z
current_stage: null
stages_completed:
  - plan: 2025-12-26T22:50:00Z
  - implement: 2025-12-26T22:55:00Z
  - test: 2025-12-26T23:00:00Z

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

- [x] **1. Plan**: Complete → implementation-plan.md
- [x] **2. Implement**: Complete → implementation-walkthrough.md
- [x] **3. Test**: Complete → test-walkthrough.md

## Dependencies

### Requires
- bolt-webview-lit-migration-3 (Bolts view pattern to follow)

### Enables
- bolt-webview-lit-migration-5 (all views ready for state context)

## Success Criteria

### Specs View (via HTML - hybrid approach)
- [x] Tree structure shows intents/units/stories
- [x] Folder expand/collapse with icons
- [x] File click opens in VS Code editor
- [x] Filter dropdown works
- [x] Empty state for no results

### Overview View (via HTML - hybrid approach)
- [x] All sections display (progress, actions, intents, standards, resources)
- [x] Stats update when data changes
- [x] Quick actions execute commands
- [x] Resource links open correctly
- [x] Intents and standards list properly

### Shared Components (Lit)
- [x] `<empty-state>` component created for future use
- [x] `<progress-bar>` component created for future use

## Notes

- Specs tree uses recursive component pattern
- Search debouncing for performance
- Quick actions map to VS Code command IDs
- Getting started shows conditionally for new projects
