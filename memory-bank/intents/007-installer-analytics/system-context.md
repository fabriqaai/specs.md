# System Context: Installer Analytics with Mixpanel

## Boundaries

### In Scope

- Event tracking during installer execution
- Machine-based identification (SHA-256 hash of hostname)
- Multiple IDE selection tracking
- Per-IDE installation completion tracking
- Shell/terminal environment detection
- Environment variable overrides (disable telemetry)
- Mixpanel SDK integration

### Out of Scope

- Local file storage for analytics
- User consent prompts (no consent needed)
- Custom analytics backend
- Detailed error reporting/crash analytics

---

## Actors

### Primary Actors

#### AI-Native Engineer (End User)

- Runs the specsmd installer
- Selects one or more IDEs
- Automatically tracked (no consent prompt)
- Can opt-out via environment variable

#### specs.md Product Team

- Views Mixpanel dashboards
- Analyzes installation funnels
- Tracks per-IDE install counts
- Makes product decisions based on data

### System Actors

#### Installer CLI

- Generates hashed machine ID
- Detects shell environment
- Sends events to Mixpanel
- Tracks multi-IDE selection

#### Mixpanel

- Receives and stores events
- Provides dashboards and analytics
- Handles geolocation from IP
- Tracks unique users by `distinct_id`

---

## External Systems

### Mixpanel Analytics

- **Interface**: Mixpanel Node.js SDK (`mixpanel` npm package)
- **Data Exchange**: Individual events via `mixpanel.track()`
- **Dependency**: Optional - failures are silent
- **Auth**: Project token (embedded in package)
- **Geolocation**: IP used for country/city lookup, then discarded

### Operating System

- **Interface**: `os.hostname()` from Node.js
- **Data Exchange**: Hostname string (hashed before use)
- **Dependency**: Required for user identification

### Environment Variables

- **Interface**: `process.env`
- **Data Exchange**: `SPECSMD_TELEMETRY_DISABLED`, `DO_NOT_TRACK`, `CI`, `SHELL`, `ComSpec`
- **Dependency**: Optional overrides and shell detection

---

## Identification Strategy

Two IDs are used together for complete tracking:

| ID | Source | Purpose |
|----|--------|---------|
| `distinct_id` | Salted SHA-256 of `os.hostname()` | Identify the machine (stable across runs) |
| `session_id` | `crypto.randomUUID()` | Identify each installer run (unique per execution) |

### Machine Hash (distinct_id)

```typescript
import { createHash } from 'node:crypto';
import { hostname } from 'node:os';

// Salt prevents reverse-lookup of hostnames (GDPR compliance)
const HOSTNAME_SALT = 'specsmd-analytics-v1';

function getMachineId(): string {
  const machineHostname = hostname();
  return createHash('sha256')
    .update(HOSTNAME_SALT + machineHostname)
    .digest('hex');
}
```

### Session ID

```typescript
import { randomUUID } from 'node:crypto';

function getSessionId(): string {
  return randomUUID();
}
```

### Properties

| Property | distinct_id | session_id |
|----------|-------------|------------|
| **Stable** | Yes (same per machine) | No (new each run) |
| **Reversible** | No (SHA-256 hash) | N/A |
| **Persistence** | Computed at runtime | Computed at runtime |
| **Use Case** | Track repeat users | Count runs per machine |

### Example

```text
Machine: "Johns-MacBook-Pro.local"

Run 1:
  distinct_id: "a1b2c3d4e5f6..." (SHA-256)
  session_id:  "550e8400-e29b-41d4-a716-446655440000" (UUID)

Run 2 (same machine):
  distinct_id: "a1b2c3d4e5f6..." (SAME)
  session_id:  "6ba7b810-9dad-11d1-80b4-00c04fd430c8" (DIFFERENT)
```

---

## Integration Points

### Installer CLI ↔ Analytics Module

```text
Installation starts
  → Compute SHA-256 of os.hostname() (distinct_id)
  → Generate random UUID (session_id)
  → Detect shell environment
  → Send installer_started event
  → Continue installation

User selects IDEs and confirms (e.g., 3 IDEs)
  → Send ides_confirmed event with count and list (1 event)

User selects flow
  → Send flow_selected event

Installation completes for each IDE
  → Send installation_completed event per IDE (3 events)
```

### Analytics Module ↔ Mixpanel

```text
Event occurs
  → Call mixpanel.track(event, properties)
  → Fire-and-forget (no await)
  → SDK handles delivery
  → Failures ignored
```

---

## Context Diagram

```text
                    ┌─────────────────────┐
                    │   AI-Native Engineer │
                    └──────────┬──────────┘
                               │ runs installer
                               │ selects 1+ IDEs
                               ▼
                    ┌──────────────────────┐
                    │   Installer CLI       │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │  Machine Hash   │  │  SHA-256(hostname)
                    │  ├─────────────────┤  │
                    │  │  Shell Detector │  │
                    │  ├─────────────────┤  │
                    │  │  Event Tracker  │  │
                    │  └─────────────────┘  │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
       ┌─────────────────┐      ┌─────────────────┐
       │  Environment    │      │    Mixpanel     │
       │  Variables      │      │                 │
       │                 │      │  - Dashboards   │
       │  - CI           │      │  - Funnels      │
       │  - DO_NOT_TRACK │      │  - User Tracking│
       │  - SHELL        │      │  - Geolocation  │
       └─────────────────┘      └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │  specs.md Team  │
                                │  (Mixpanel UI)  │
                                └─────────────────┘
```

---

## Shell Detection Logic

```text
Platform: Windows
  → Check process.env.ComSpec
  → If contains 'powershell' → 'powershell'
  → If contains 'pwsh' → 'powershell'
  → If contains 'cmd' → 'cmd'
  → Else → 'unknown'

Platform: Unix (darwin, linux)
  → Check process.env.SHELL
  → Extract basename: /bin/zsh → 'zsh'
  → Common values: zsh, bash, fish, sh, dash
  → Else → 'unknown'
```

---

## Data Flow

### Happy Path (Multi-IDE Selection)

```text
1. User runs: npx specsmd@latest install
2. Compute distinct_id: SHA-256(os.hostname()) → "a1b2c3..."
3. Generate session_id: randomUUID() → "550e8400-..."
4. Detect shell: zsh
5. Send: installer_started { distinct_id, session_id, shell: 'zsh', ... }
6. User selects IDEs: claude-code, cursor, windsurf and confirms
7. Send: ides_confirmed { distinct_id, session_id, ide_count: 3, ides: [...] }
8. User selects flow: aidlc
9. Send: flow_selected { distinct_id, session_id, flow: 'aidlc' }
10. Installation completes for claude-code
11. Send: installation_completed { distinct_id, session_id, ide: 'claude-code', ... }
12. Installation completes for cursor
13. Send: installation_completed { distinct_id, session_id, ide: 'cursor', ... }
14. Installation completes for windsurf
15. Send: installation_completed { distinct_id, session_id, ide: 'windsurf', ... }
```

### Repeat User Path

```text
1. Same user runs installer again (same machine)
2. Compute distinct_id: SHA-256(os.hostname()) → "a1b2c3..." (SAME)
3. Generate new session_id: randomUUID() → "6ba7b810-..." (DIFFERENT)
4. Send: installer_started { distinct_id: 'a1b2c3...', session_id: '6ba7b810-...', ... }
5. Mixpanel associates with existing user profile
6. Can now see: this user has run installer 2+ times (2 session_ids)
```

### Opt-Out Path

```text
1. User runs: SPECSMD_TELEMETRY_DISABLED=1 npx specsmd@latest install
2. Analytics module detects env var
3. All tracking calls become no-ops
4. Installation proceeds normally
5. No events sent
```

---

## Constraints

### Technical Constraints

- Must work offline (graceful degradation)
- Must not add noticeable latency (fire-and-forget)
- Must work across all platforms (macOS, Linux, Windows)
- Single dependency: `mixpanel` npm package
- No file system writes for analytics

### Privacy Constraints

- No PII collection
- Hostname salted + hashed with SHA-256 (not reversible)
- IP used for geolocation only, not stored
- No local persistence

### Operational Constraints

- Mixpanel free tier (1M events/month)
- No backend infrastructure needed
- Project token must be kept in source (acceptable for analytics)

---

## Quality Attributes

### Privacy

- Anonymous by design
- Machine ID is salted + hashed (SHA-256)
- No data written to disk

### Reliability

- Never break installation
- Silent failures
- Offline-capable

### Simplicity

- Single SDK dependency
- No custom backend
- No local storage
- Fire-and-forget pattern

### Trackability

- Same user identified across sessions
- Per-IDE install counts accurate
- Multi-IDE patterns visible
