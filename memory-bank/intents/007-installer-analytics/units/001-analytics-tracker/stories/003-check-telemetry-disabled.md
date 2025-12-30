---
id: 003-check-telemetry-disabled
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: ready
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: false
---

# Story: Check if Telemetry is Disabled

## User Story

**As a** user who values privacy
**I want** to disable telemetry via environment variables
**So that** no analytics data is sent without my knowledge

## Acceptance Criteria

- [ ] **Given** SPECSMD_TELEMETRY_DISABLED=1, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** DO_NOT_TRACK=1, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** CI=true, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** GITHUB_ACTIONS=true, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** GITLAB_CI=true, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** CIRCLECI=true, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** JENKINS_URL is set, **When** checking telemetry status, **Then** telemetry is disabled
- [ ] **Given** no disable flags set, **When** checking telemetry status, **Then** telemetry is enabled

## Technical Notes

```typescript
function isTelemetryDisabled(): boolean {
  return (
    process.env.SPECSMD_TELEMETRY_DISABLED === '1' ||
    process.env.DO_NOT_TRACK === '1' ||
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.JENKINS_URL !== undefined ||
    process.env.CIRCLECI === 'true'
  );
}
```

## Dependencies

### Requires
- None

### Enables
- 001-initialize-mixpanel (determines if analytics should be enabled)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Multiple disable flags set | Still disabled (any one is enough) |
| SPECSMD_TELEMETRY_DISABLED=0 | NOT disabled (only "1" disables) |
| DO_NOT_TRACK=true | NOT disabled (only "1" disables) |

## Out of Scope

- Persistent opt-out storage
- CLI flag handling (separate story)
