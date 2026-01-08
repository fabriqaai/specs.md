---
id: bolt-vscode-analytics-core-1
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
type: simple-construction-bolt
status: complete
stories:
  - 001-initialize-mixpanel-tracker
  - 002-generate-machine-session-ids
  - 003-detect-ide-environment
  - 004-implement-privacy-controls
  - 005-error-isolation-wrappers
created: 2025-01-08T12:50:00Z
started: 2025-01-09T10:00:00Z
completed: 2025-01-09T10:50:00Z
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-01-09T10:10:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-01-09T10:35:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-01-09T10:50:00Z
    artifact: test-walkthrough.md

requires_bolts: []
enables_bolts:
  - bolt-vscode-analytics-lifecycle-1
  - bolt-vscode-analytics-engagement-1
  - bolt-vscode-analytics-metrics-1
requires_units: []
blocks: false

complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: bolt-vscode-analytics-core-1

## Overview

Foundation bolt that creates the analytics infrastructure for the VS Code extension, including Mixpanel integration, ID generation, IDE detection, and privacy controls.

## Objective

Implement a complete analytics tracker module that can be used by all other analytics units. All code must be wrapped in error isolation to ensure extension stability.

## Stories Included

- **001-initialize-mixpanel-tracker**: Initialize Mixpanel with EU endpoint (Must)
- **002-generate-machine-session-ids**: Generate consistent machine ID and unique session ID (Must)
- **003-detect-ide-environment**: Detect VS Code, Cursor, Windsurf, etc. (Must)
- **004-implement-privacy-controls**: Respect opt-out env vars and VS Code settings (Must)
- **005-error-isolation-wrappers**: Wrap all analytics in try-catch (Must)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. plan**: Review requirements and design tracker API
- [ ] **2. implement**: Create AnalyticsTracker class with all methods
- [ ] **3. test**: Write unit tests for all functionality
- [ ] **4. integrate**: Add to package.json, export from module

## Dependencies

### Requires
- None (foundation bolt)

### Enables
- bolt-vscode-analytics-lifecycle-1 (lifecycle events)
- bolt-vscode-analytics-engagement-1 (engagement events)
- bolt-vscode-analytics-metrics-1 (project metrics)

## Success Criteria

- [ ] AnalyticsTracker singleton created
- [ ] Mixpanel initialized with EU endpoint
- [ ] Machine ID consistent across activations
- [ ] IDE detection works for VS Code, Cursor, Windsurf, VSCodium
- [ ] Privacy opt-out respected
- [ ] All errors silently caught
- [ ] Tests passing with >80% coverage

## Notes

Reference `src/lib/analytics/` from the npx installer for patterns. This is the critical foundation - all other analytics bolts depend on this.
