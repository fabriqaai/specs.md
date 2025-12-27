# Intent: Installer Analytics with Mixpanel

## Overview

Implement lightweight analytics using Mixpanel to track installer usage patterns. This helps the specs.md team understand adoption, IDE preferences, flow popularity, and installation behavior.

---

## Analytics Provider

**Mixpanel** - SaaS analytics platform with:
- Node.js SDK (`mixpanel` npm package)
- Built-in dashboards and funnels
- Geolocation from IP (IP not stored)
- Free tier sufficient for our needs

---

## Problem Statement

Currently, specsmd has no visibility into:

- How many users run the installer
- Which IDEs/tools are most popular (users can select multiple)
- Which flows users install
- How many IDEs users typically select together
- Repeat installation patterns per user
- Per-IDE install counts
- Geographic distribution of users
- Terminal/shell environment preferences

This makes it difficult to prioritize development efforts and understand user needs.

---

## Functional Requirements

### FR-1: User & Session Identification

- FR-1.1: System SHALL generate `distinct_id` by hashing the machine hostname with a salt (SHA-256)
- FR-1.2: System SHALL use a constant salt to prevent reverse-lookup of hostnames
- FR-1.3: System SHALL generate `session_id` as a random UUID for each installer run
- FR-1.4: System SHALL use the same `distinct_id` and `session_id` for all events within a session
- FR-1.5: System SHALL NOT persist any data to disk
- FR-1.6: System SHALL NOT collect any PII (hostname is salted+hashed, not stored)

**Identification Strategy:**
- `distinct_id`: Stable machine identifier (salted SHA-256 of hostname) - same across runs, not reversible
- `session_id`: Unique per installer execution (random UUID) - different each run

### FR-2: Event Tracking

Each event is sent individually when the action occurs (NOT batched):

- FR-2.1: System SHALL track `installer_started` event when npx command runs
- FR-2.2: System SHALL track `ides_confirmed` event when user confirms IDE selection
- FR-2.3: System SHALL track `flow_selected` event when user selects a flow
- FR-2.4: System SHALL track `installation_completed` event on success (one per IDE)
- FR-2.5: System SHALL track `installation_failed` event on failure (with error category)

### FR-3: Multiple IDE Selection

- FR-3.1: User CAN select 1 or more IDEs from the list
- FR-3.2: System SHALL send one `ides_confirmed` event with total count and list of IDEs
- FR-3.3: System SHALL send one `installation_completed` event per IDE installed

### FR-4: Event Properties

Each event SHALL include:

- FR-4.1: `distinct_id` - salted SHA-256 hash of machine hostname (stable across runs)
- FR-4.2: `session_id` - random UUID for this installer run (unique per execution)
- FR-4.3: `$os` - operating system (darwin, linux, win32)
- FR-4.4: `shell` - terminal environment (zsh, bash, powershell, cmd, fish, etc.)
- FR-4.5: `node_version` - Node.js major version (e.g., "18", "20")
- FR-4.6: `specsmd_version` - current specsmd package version

### FR-5: Mixpanel Configuration

- FR-5.1: System SHALL use Mixpanel Node.js SDK
- FR-5.2: System SHALL allow Mixpanel to handle geolocation automatically (IP used for geo lookup, then discarded by Mixpanel)
- FR-5.3: System SHALL use fire-and-forget (no callbacks awaited)

### FR-6: Environment Overrides

- FR-6.1: System SHALL support `SPECSMD_TELEMETRY_DISABLED=1` to disable analytics
- FR-6.2: System SHALL support `--no-telemetry` flag to disable analytics
- FR-6.3: System SHALL auto-disable in CI environments (CI=true, GITHUB_ACTIONS, etc.)
- FR-6.4: System SHALL respect `DO_NOT_TRACK=1` environment variable

### FR-7: Privacy Documentation

- FR-7.1: Repository SHALL include a `PRIVACY.md` file at the root
- FR-7.2: Privacy documentation SHALL disclose what data is collected
- FR-7.3: Privacy documentation SHALL explain how to opt-out
- FR-7.4: Privacy documentation SHALL state the legal basis (legitimate interest)
- FR-7.5: Privacy documentation SHALL confirm no PII is collected
- FR-7.6: README SHALL reference the privacy documentation

---

## Non-Functional Requirements

### NFR-1: Performance

- Analytics calls SHALL be non-blocking (fire-and-forget)
- Analytics SHALL add less than 50ms to installation time
- Analytics failures SHALL NOT cause installation failures

### NFR-2: Privacy (GDPR Compliant)

- No PII collection
- Hostname is salted + hashed (SHA-256), not reversible
- IP addresses NOT stored by Mixpanel (only used for geolocation, then discarded)
- No folder names collected
- No data persisted to disk

### NFR-3: Reliability

- Analytics failures are silent
- Offline installations proceed without error
- Network errors do not surface to users

---

## Events Schema

### Event 1: installer_started

Sent immediately when `npx specsmd@latest install` runs.

```typescript
{
  event: 'installer_started',
  properties: {
    distinct_id: string,      // Salted SHA-256 hash of os.hostname() - stable across runs
    session_id: string,       // Random UUID for this run - unique per execution
    $os: string,              // 'darwin' | 'linux' | 'win32'
    shell: string,            // 'zsh' | 'bash' | 'powershell' | 'cmd' | 'fish' | 'unknown'
    node_version: string,     // e.g., '20'
    specsmd_version: string,  // e.g., '0.4.0'
  }
}
```

### Event 2: ides_confirmed

Sent once when user confirms their IDE selection (after selecting 1 or more).

```typescript
{
  event: 'ides_confirmed',
  properties: {
    distinct_id: string,
    session_id: string,
    ide_count: number,        // How many IDEs selected (1, 2, 3, etc.)
    ides: string[],           // ['claude-code', 'cursor'] - list of all selected
  }
}
```

### Event 3: flow_selected

Sent when user selects a flow to install.

```typescript
{
  event: 'flow_selected',
  properties: {
    distinct_id: string,
    session_id: string,
    flow: string,             // 'aidlc' | 'custom' | etc.
  }
}
```

### Event 4: installation_completed

Sent for EACH IDE that completes installation successfully. If user selected 3 IDEs, up to 3 events.

```typescript
{
  event: 'installation_completed',
  properties: {
    distinct_id: string,
    session_id: string,
    ide: string,              // Which IDE was installed
    flow: string,
    duration_ms: number,      // Time for this IDE's installation
    files_created: number,    // Number of files created for this IDE
  }
}
```

### Event 5: installation_failed

Sent when installation fails for an IDE.

```typescript
{
  event: 'installation_failed',
  properties: {
    distinct_id: string,
    session_id: string,
    ide: string,              // Which IDE failed
    error_category: string,   // 'file_permission' | 'validation' | 'unknown'
    flow: string,
  }
}
```

---

## Mixpanel Dashboard Metrics

With these events, we can track:

### User & Install Metrics
1. **Unique Machines**: Count of unique `distinct_id` values
2. **Total Sessions**: Count of unique `session_id` values (or `installer_started` events)
3. **Sessions per Machine**: Count of unique `session_id` grouped by `distinct_id`
4. **Repeat Users**: Machines with 2+ sessions (multiple `session_id` per `distinct_id`)

### IDE Metrics
5. **IDE Popularity**: Count occurrences in `ides` array from `ides_confirmed`
6. **Per-IDE Install Count**: Count of `installation_completed` grouped by `ide`
7. **Multi-IDE Sessions**: Count of `ides_confirmed` where `ide_count > 1`
8. **Average IDEs per Session**: Average of `ide_count` from `ides_confirmed`
9. **IDE Combinations**: Common pairs/groups from `ides` array

### Flow & Completion Metrics
10. **Flow Popularity**: Breakdown of `flow_selected` by flow
11. **Success Rate**: `installation_completed` / IDEs in `ides_confirmed`
12. **Installation Funnel**: started → ides_confirmed → flow_selected → completed

### Environment Metrics
13. **Geographic Distribution**: Country/city from geolocation
14. **OS Distribution**: darwin vs linux vs win32
15. **Shell Preferences**: zsh vs bash vs powershell etc.

---

## Success Criteria

- Analytics integrated with zero impact on installation reliability
- Mixpanel dashboard shows meaningful metrics within 1 week
- Can identify repeat users via hashed machine ID
- Can track per-IDE install counts accurately
- Can see multi-IDE selection patterns
- Can see geographic distribution

---

## Acceptance Criteria

### AC-1: Machine Hash ID

- GIVEN a user running the installer
- WHEN installation starts
- THEN `distinct_id` is SHA-256 hash of `os.hostname()`
- AND the same hash is used for repeat runs on same machine
- AND nothing is written to disk

### AC-2: Multiple IDE Selection

- GIVEN a user selects 3 IDEs (claude-code, cursor, windsurf)
- WHEN they confirm selection
- THEN 1 `ides_confirmed` event is sent with `ide_count: 3` and `ides: ['claude-code', 'cursor', 'windsurf']`

### AC-3: Per-IDE Completion

- GIVEN a user selected 2 IDEs
- WHEN installation completes for both
- THEN 2 `installation_completed` events are sent (one per IDE)

### AC-4: Shell Detection

- GIVEN a user in PowerShell on Windows
- WHEN `installer_started` event is sent
- THEN `shell` property is "powershell"

### AC-5: Environment Override

- GIVEN `SPECSMD_TELEMETRY_DISABLED=1` is set
- WHEN installer runs
- THEN no events are sent to Mixpanel

### AC-6: Graceful Failure

- GIVEN Mixpanel endpoint is unreachable
- WHEN installer attempts to send events
- THEN installation proceeds successfully
- AND no error is shown to user

### AC-7: Repeat User Tracking

- GIVEN a user runs the installer twice on the same machine
- WHEN viewing Mixpanel
- THEN both sessions have the same `distinct_id`
- AND can see this user has 2 install sessions

### AC-8: Privacy Documentation

- GIVEN a user wants to understand data collection
- WHEN they read PRIVACY.md
- THEN they can see exactly what data is collected
- AND they can see how to disable telemetry
- AND they understand no personal information is stored
