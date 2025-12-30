---
id: 006-cli-no-telemetry-flag
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: ready
priority: should
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: false
---

# Story: Support --no-telemetry CLI Flag

## User Story

**As a** user who prefers CLI flags over environment variables
**I want** to use --no-telemetry flag when running the installer
**So that** I can disable analytics without setting environment variables

## Acceptance Criteria

- [ ] **Given** user runs `npx specsmd@latest install --no-telemetry`, **When** installer starts, **Then** telemetry is disabled
- [ ] **Given** --no-telemetry flag is present, **When** checking telemetry status, **Then** isTelemetryDisabled() returns true
- [ ] **Given** both --no-telemetry and env vars are set, **When** checking, **Then** telemetry is disabled

## Technical Notes

- Flag should be parsed before analytics.init() is called
- Need to integrate with existing CLI argument parsing
- May require passing flag state to analytics module

```typescript
// Option 1: Check process.argv directly
const hasNoTelemetryFlag = process.argv.includes('--no-telemetry');

// Option 2: Accept as parameter to init()
analytics.init({ noTelemetry: parsedArgs.noTelemetry });
```

## Dependencies

### Requires
- 003-check-telemetry-disabled (extends the check)

### Enables
- None

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| --no-telemetry without value | Telemetry disabled |
| --no-telemetry=true | Telemetry disabled |
| --no-telemetry=false | Interpret as disabled (presence = disabled) |

## Out of Scope

- Persistent flag storage
- Config file option
