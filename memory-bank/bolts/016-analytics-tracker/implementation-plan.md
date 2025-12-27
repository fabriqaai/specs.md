---
stage: plan
bolt: 016-analytics-tracker
created: 2025-12-28T18:30:00Z
---

# Implementation Plan: Analytics Tracker

## Objective

Build a Mixpanel analytics module for the specsmd installer that tracks anonymous usage patterns while respecting user privacy and opt-out preferences. The module must be fire-and-forget (non-blocking) and fail silently to never disrupt installations.

## Deliverables

### Files to Create

```
src/analytics/
├── index.js           # Singleton export: analytics instance
├── tracker.js         # AnalyticsTracker class with all tracking methods
├── machine-id.js      # getMachineId() - salted SHA-256 of hostname
└── env-detector.js    # detectShell(), isTelemetryDisabled()
```

### Functions to Implement

| Function | File | Purpose |
|----------|------|---------|
| `getMachineId()` | machine-id.js | Salted SHA-256 hash of hostname as distinct_id |
| `getSessionId()` | tracker.js | Random UUID per run |
| `detectShell()` | env-detector.js | Return shell name (zsh, bash, powershell, cmd, etc.) |
| `isTelemetryDisabled()` | env-detector.js | Check env vars and CLI flag |
| `init()` | tracker.js | Initialize Mixpanel with IDs |
| `trackInstallerStarted()` | tracker.js | installer_started event |
| `trackIdesConfirmed()` | tracker.js | ides_confirmed event with ide_count, ides[] |
| `trackFlowSelected()` | tracker.js | flow_selected event |
| `trackInstallationCompleted()` | tracker.js | installation_completed with ide, flow, duration_ms, files_created |
| `trackInstallationFailed()` | tracker.js | installation_failed with ide, error_category, flow |

## Dependencies

### External Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| `mixpanel` | Mixpanel Node.js SDK | Must add to package.json |

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| Node.js `crypto` | SHA-256 hashing and UUID generation |
| Node.js `os` | hostname() for machine ID |

## Technical Approach

### Machine ID Generation

```javascript
const salt = 'specsmd-analytics-v1';
const machineId = crypto.createHash('sha256')
    .update(salt + os.hostname())
    .digest('hex');
```

- Salt is constant to prevent rainbow table attacks
- Same machine always produces same hash
- No way to reverse-lookup the hostname

### Session ID Generation

```javascript
const sessionId = crypto.randomUUID();
```

- Unique per installer run
- Used to group events within a single session

### Base Properties (All Events)

```javascript
{
    distinct_id: machineId,
    session_id: sessionId,
    $os: process.platform,
    shell: detectShell(),
    node_version: process.version,
    specsmd_version: pkg.version
}
```

### Telemetry Disabled Check

Check in this priority order:
1. `--no-telemetry` CLI flag (process.argv)
2. `SPECSMD_TELEMETRY_DISABLED=1`
3. `DO_NOT_TRACK=1`
4. CI environment detection:
   - `CI=true`
   - `GITHUB_ACTIONS=true`
   - `GITLAB_CI=true`
   - `JENKINS_URL` is set
   - `CIRCLECI=true`

### Fire-and-Forget Pattern

```javascript
track(eventName, properties = {}) {
    if (!this.enabled) return;

    try {
        this.mixpanel.track(eventName, {
            ...this.baseProperties,
            ...properties
        });
        // No await - fire and forget
    } catch (e) {
        // Silent failure - never break installation
    }
}
```

### Shell Detection

| Platform | Check | Example Values |
|----------|-------|----------------|
| Unix | `process.env.SHELL` basename | zsh, bash, fish, sh |
| Windows | `process.env.ComSpec` | powershell, pwsh, cmd |
| Unknown | fallback | "unknown" |

## Acceptance Criteria

### Core Functionality
- [ ] Mixpanel SDK initialized with project token
- [ ] Machine ID is consistent across runs on same machine
- [ ] Session ID is unique per run
- [ ] All 5 event types tracked with correct properties
- [ ] Events include all base properties

### Privacy & Opt-out
- [ ] Telemetry disabled when SPECSMD_TELEMETRY_DISABLED=1
- [ ] Telemetry disabled when DO_NOT_TRACK=1
- [ ] Telemetry disabled in CI environments
- [ ] --no-telemetry CLI flag works

### Reliability
- [ ] Analytics adds <50ms to installation time
- [ ] Silent failure on network errors
- [ ] Never breaks installation on analytics failure
- [ ] Works offline without errors

### Quality
- [ ] No PII collected (GDPR compliant)
- [ ] Code follows project coding standards
- [ ] Linting passes

## Events Reference

| Event | Properties | When Fired |
|-------|------------|------------|
| `installer_started` | base only | Installer begins |
| `ides_confirmed` | ide_count, ides[] | After IDE selection confirmed |
| `flow_selected` | flow | After flow selection |
| `installation_completed` | ide, flow, duration_ms, files_created | Per IDE after successful install |
| `installation_failed` | ide, error_category, flow? | Per IDE after failed install |

## Notes

- Mixpanel project token will be embedded in source (standard practice for analytics)
- Geolocation is handled by Mixpanel from IP address - no action needed
- Package.json must be updated to include mixpanel dependency
- Integration with installer CLI will be done by calling tracking methods at appropriate points
