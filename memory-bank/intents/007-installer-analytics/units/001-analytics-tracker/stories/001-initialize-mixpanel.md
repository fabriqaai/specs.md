---
id: 001-initialize-mixpanel
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: complete
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: true
---

# Story: Initialize Mixpanel with Machine and Session IDs

## User Story

**As a** specsmd installer
**I want** to initialize Mixpanel with stable machine ID and unique session ID
**So that** I can track usage patterns while identifying repeat installations

## Acceptance Criteria

- [ ] **Given** the installer starts, **When** analytics.init() is called, **Then** Mixpanel SDK is initialized with project token
- [ ] **Given** a machine hostname, **When** generating distinct_id, **Then** it is a salted SHA-256 hash of the hostname
- [ ] **Given** the same machine, **When** running installer multiple times, **Then** distinct_id is identical across runs
- [ ] **Given** any installer run, **When** generating session_id, **Then** it is a random UUID unique to this execution
- [ ] **Given** analytics is initialized, **When** any event is tracked, **Then** both distinct_id and session_id are included

## Technical Notes

- Use `crypto.createHash('sha256')` for hostname hashing
- Salt: `'specsmd-analytics-v1'` (constant, prevents reverse lookup)
- Use `crypto.randomUUID()` for session ID
- Mixpanel token will be embedded in source code
- No data should be written to disk

## Dependencies

### Requires
- None (foundation story)

### Enables
- 004-track-installer-events
- 005-track-selection-events

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Hostname contains special characters | Hash handles any string |
| Very long hostname | SHA-256 handles any length |
| Hostname changes (rare) | New distinct_id generated |

## Out of Scope

- Persistent ID storage (explicitly not wanted)
- User-provided ID
