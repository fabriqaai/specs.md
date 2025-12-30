---
id: 016-analytics-tracker
unit: 001-analytics-tracker
intent: 007-installer-analytics
type: simple-construction-bolt
status: complete
stories:
  - 001-initialize-mixpanel
  - 002-generate-machine-hash
  - 003-generate-session-id
  - 004-detect-shell
  - 005-detect-telemetry-disabled
  - 006-track-installer-started
  - 007-track-ides-confirmed
  - 008-track-flow-selected
  - 009-track-installation-completed
  - 010-track-installation-failed
  - 011-fire-and-forget
  - 012-geolocation-support
created: 2025-12-28T12:00:00Z
started: 2025-12-28T18:30:00Z
completed: "2025-12-28T17:29:23Z"
current_stage: null
stages_completed:
  - name: plan
    completed: 2025-12-28T18:35:00Z
    artifact: implementation-plan.md
  - name: implement
    completed: 2025-12-28T18:50:00Z
    artifact: implementation-walkthrough.md
  - name: test
    completed: 2025-12-28T19:00:00Z
    artifact: test-walkthrough.md
requires_bolts: []
enables_bolts:
  - 017-privacy-documentation
requires_units: []
blocks: false
complexity:
  avg_complexity: 2
  avg_uncertainty: 1
  max_dependencies: 1
  testing_scope: 2
---

# Bolt: 016-analytics-tracker

## Overview

Implement Mixpanel analytics integration for the specsmd installer. This bolt adds anonymous usage tracking to understand adoption patterns, IDE preferences, and installation behavior.

## Objective

Create an AnalyticsTracker module that:
- Generates stable machine ID (salted SHA-256 of hostname)
- Generates unique session ID per run
- Detects shell environment
- Sends events to Mixpanel (fire-and-forget)
- Respects opt-out environment variables

## Stories Included

1. **Initialize Mixpanel** with project token
2. **Generate machine hash** (salted SHA-256 of hostname) as distinct_id
3. **Generate session ID** (random UUID) per run
4. **Detect shell** (zsh, bash, powershell, cmd, fish)
5. **Detect telemetry disabled** via environment variables
6. **Track installer_started** event
7. **Track ides_confirmed** event with count and list
8. **Track flow_selected** event
9. **Track installation_completed** event per IDE
10. **Track installation_failed** event with error category
11. **Fire-and-forget** pattern (non-blocking)
12. **Geolocation support** (Mixpanel handles from IP)

## Bolt Type

**Type**: Simple Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/simple-construction-bolt.md`

## Stages

- [ ] **1. Spec**: Create implementation plan
- [ ] **2. Implement**: Build analytics module
- [ ] **3. Test**: Verify tracking works

## Dependencies

### Requires
- None (standalone module)

### Enables
- 017-privacy-documentation

## Files to Create/Modify

```
src/
├── analytics/
│   ├── index.ts           # Exports analytics singleton
│   ├── tracker.ts         # AnalyticsTracker class
│   ├── machine-id.ts      # getMachineId() - salted SHA-256
│   └── env-detector.ts    # Shell and CI detection
```

## Success Criteria

- [ ] Mixpanel SDK initialized correctly
- [ ] Machine ID is consistent across runs on same machine
- [ ] Session ID is unique per run
- [ ] Shell detected correctly on macOS, Linux, Windows
- [ ] Telemetry disabled when env vars set
- [ ] All 5 events tracked with correct properties
- [ ] Events are fire-and-forget (non-blocking)
- [ ] Failures are silent (never break installation)
- [ ] No PII collected (GDPR compliant)

## Notes

- Mixpanel token will be embedded in source (acceptable for analytics)
- Salt prevents reverse-lookup of hostname hash
- Must add `mixpanel` as a dependency to package.json
