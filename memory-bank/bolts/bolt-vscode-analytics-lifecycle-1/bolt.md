---
id: bolt-vscode-analytics-lifecycle-1
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
type: simple-construction-bolt
status: complete
stories:
  - 001-track-extension-activation
  - 002-track-welcome-view-funnel
  - 003-detect-first-time-installation
  - 004-track-categorize-errors
created: 2025-01-08T12:50:00.000Z
started: 2026-01-09T15:30:00.000Z
completed: "2026-01-08T22:16:49Z"
current_stage: null
stages_completed:
  - name: plan
    completed: 2026-01-09T15:40:00.000Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2026-01-09T16:05:00.000Z
    artifact: implementation-walkthrough.md
requires_bolts:
  - bolt-vscode-analytics-core-1
enables_bolts: []
requires_units: []
blocks: false
complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: bolt-vscode-analytics-lifecycle-1

## Overview

Implement lifecycle event tracking including extension activation, welcome view funnel, and error capture. These form the critical adoption funnel.

## Objective

Add tracking calls to extension.ts and WelcomeViewProvider to capture activation, onboarding, and error events.

## Stories Included

- **001-track-extension-activation**: Track every activation with project context (Must)
- **002-track-welcome-view-funnel**: Track onboarding funnel events (Must)
- **003-detect-first-time-installation**: Detect first-ever activation (Must)
- **004-track-categorize-errors**: Track errors with categorization (Should)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. plan**: Map integration points in extension.ts and WelcomeViewProvider
- [ ] **2. implement**: Add tracking calls to existing code
- [ ] **3. test**: Test all events fire correctly
- [ ] **4. integrate**: Verify no impact on extension performance

## Dependencies

### Requires
- bolt-vscode-analytics-core-1 (tracker module)

### Enables
- None (leaf bolt)

## Success Criteria

- [ ] extension_activated fires on every activation
- [ ] is_first_activation accurate
- [ ] Welcome funnel events fire correctly
- [ ] Error events capture category and component
- [ ] No impact on activation time
- [ ] Tests passing

## Notes

Integration points:
- `extension.ts` activate() function
- `WelcomeViewProvider.ts` message handlers
- Add try-catch wrappers for error tracking
