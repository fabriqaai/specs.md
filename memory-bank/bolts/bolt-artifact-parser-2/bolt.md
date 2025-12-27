---
id: bolt-artifact-parser-2
unit: artifact-parser
intent: 011-vscode-extension
type: simple-construction-bolt
status: complete
stories:
  - 005-bolt-dependencies
  - 006-activity-feed-derivation
created: 2025-12-26T10:00:00Z
started: 2025-12-26T11:00:00Z
completed: 2025-12-26T12:30:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-26T11:15:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-26T12:00:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-26T12:30:00Z
    artifact: test-walkthrough.md

requires_bolts:
  - bolt-artifact-parser-1
enables_bolts:
  - bolt-sidebar-provider-3
  - bolt-sidebar-provider-4
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 1
---

# Bolt: bolt-artifact-parser-2

## Overview

Second artifact-parser bolt that adds dependency parsing and activity feed derivation capabilities to support the new command center UI.

## Objective

Implement bolt dependency parsing (requires_bolts, enables_bolts) and activity feed derivation from bolt timestamps.

## Stories Included

- **005-bolt-dependencies**: Parse and compute bolt dependencies (Must)
- **006-activity-feed-derivation**: Derive activity events from timestamps (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [x] **1. Plan**: Complete → implementation-plan.md
- [x] **2. Implement**: Complete → implementation-walkthrough.md
- [x] **3. Test**: Complete → test-walkthrough.md

## Dependencies

### Requires
- bolt-artifact-parser-1 (core parsing foundation)

### Enables
- bolt-sidebar-provider-3 (needs dependency data)
- bolt-sidebar-provider-4 (needs activity feed)

## Success Criteria

- [x] Bolt dependencies parsed from frontmatter
- [x] isBlocked, blockedBy, unblocksCount computed
- [x] Activity feed derived from timestamps
- [x] Events sorted by timestamp descending
- [x] Unit tests passing (164 tests)
- [x] Handles missing/malformed data gracefully

## Notes

- Extends existing Bolt interface with new fields
- Uses existing frontmatter parser
- O(n) complexity for dependency computation
