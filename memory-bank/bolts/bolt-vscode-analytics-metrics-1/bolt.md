---
id: bolt-vscode-analytics-metrics-1
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
type: simple-construction-bolt
status: complete
stories:
  - 001-track-project-snapshot
  - 002-track-project-changes
  - 003-implement-debouncing
  - 004-implement-rate-limiting
created: 2025-01-08T12:50:00.000Z
started: 2026-01-09T10:00:00.000Z
completed: "2026-01-08T22:50:00Z"
current_stage: null
stages_completed:
  - name: plan
    completed: 2026-01-09T10:05:00.000Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2026-01-09T10:15:00.000Z
    artifact: implementation-walkthrough.md
requires_bolts:
  - bolt-vscode-analytics-core-1
enables_bolts: []
requires_units: []
blocks: false
complexity:
  avg_complexity: 2
  avg_uncertainty: 2
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: bolt-vscode-analytics-metrics-1

## Overview

Implement project structure tracking with safeguards against event spam. Includes debouncing and rate limiting for file watcher integration.

## Objective

Create a ProjectMetricsTracker class that captures project snapshots and delta changes without overwhelming analytics with rapid file change events.

## Stories Included

- **001-track-project-snapshot**: Capture project state on activation (Could)
- **002-track-project-changes**: Track meaningful count changes (Could)
- **003-implement-debouncing**: 5-second debounce for file changes (Could)
- **004-implement-rate-limiting**: Max 5 events per minute (Could)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. plan**: Design ProjectMetricsTracker class
- [ ] **2. implement**: Create tracker with debounce and rate limit
- [ ] **3. test**: Test under rapid file change scenarios
- [ ] **4. integrate**: Hook into FileWatcher and activation

## Dependencies

### Requires
- bolt-vscode-analytics-core-1 (tracker module)

### Enables
- None (leaf bolt)

## Success Criteria

- [ ] Snapshot fires once per activation
- [ ] Changes only fire when counts differ
- [ ] Debouncing prevents rapid-fire events
- [ ] Rate limiting caps at 5/minute
- [ ] No memory leaks from timers
- [ ] Tests pass under load

## Notes

This is lowest priority (Could). Can be deferred if time-constrained. Key challenge is proper timer cleanup to avoid memory leaks.
