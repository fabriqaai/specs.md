---
id: 004-track-installer-events
unit: 001-analytics-tracker
intent: 007-installer-analytics
status: ready
priority: must
created: 2025-12-28T12:30:00Z
assigned_bolt: 016-analytics-tracker
implemented: false
---

# Story: Track Installer Lifecycle Events

## User Story

**As a** specsmd product team member
**I want** to track when installations start, complete, and fail
**So that** I can understand installation success rates and identify issues

## Acceptance Criteria

- [ ] **Given** installer starts, **When** trackInstallerStarted() is called, **Then** installer_started event is sent with base properties
- [ ] **Given** IDE installation completes, **When** trackInstallationCompleted() is called, **Then** installation_completed event is sent with ide, flow, duration_ms, files_created
- [ ] **Given** IDE installation fails, **When** trackInstallationFailed() is called, **Then** installation_failed event is sent with ide, error_category, flow
- [ ] **Given** telemetry is disabled, **When** any track method is called, **Then** no event is sent
- [ ] **Given** Mixpanel is unreachable, **When** tracking events, **Then** errors are silently ignored

## Technical Notes

- All events include base properties (distinct_id, session_id, $os, shell, node_version, specsmd_version)
- Fire-and-forget pattern - don't await Mixpanel responses
- Wrap all tracking in try/catch to ensure silent failures

```typescript
trackInstallerStarted(): void {
  this.track('installer_started');
}

trackInstallationCompleted(ide: string, flow: string, durationMs: number, filesCreated: number): void {
  this.track('installation_completed', { ide, flow, duration_ms: durationMs, files_created: filesCreated });
}

trackInstallationFailed(ide: string, errorCategory: string, flow?: string): void {
  this.track('installation_failed', { ide, error_category: errorCategory, ...(flow && { flow }) });
}
```

## Dependencies

### Requires
- 001-initialize-mixpanel (Mixpanel must be initialized)

### Enables
- None (end of chain)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very long duration (hours) | Track as-is |
| Zero files created | Track with files_created: 0 |
| Unknown error category | Use "unknown" as category |

## Out of Scope

- Detailed error messages (only categories)
- Stack traces
