# System Context: Installer Event Tracking

## Boundaries

### In Scope
- Event collection during installer execution
- User consent management
- Analytics data transmission
- Privacy-preserving data design
- Environment detection (CI, offline)

### Out of Scope
- Analytics dashboard/visualization (separate backend concern)
- Long-term data storage architecture
- A/B testing or feature flags
- User identification or tracking across sessions
- Detailed error reporting/crash analytics

---

## Actors

### Primary Actors

#### AI-Native Engineer (End User)
- Runs the specsmd installer
- Provides (or declines) consent for analytics
- Benefits from improved installer experience based on analytics insights

#### specs.md Product Team
- Reviews analytics dashboards
- Makes product decisions based on data
- Defines which events to track

### System Actors

#### Installer CLI
- Collects events during installation
- Manages consent state
- Transmits events to analytics endpoint

#### Analytics Backend
- Receives and stores events
- Aggregates data for dashboards
- Ensures privacy compliance

---

## External Systems

### Analytics Endpoint (specs.md)
- **Interface**: HTTPS POST `/api/analytics/events`
- **Data Exchange**: Batch of anonymous events (JSON)
- **Dependency**: Optional - failures are silent
- **Auth**: None required (events are anonymous)

### Local File System
- **Interface**: File read/write
- **Data Exchange**: Consent preference stored in `~/.specsmd/telemetry-consent`
- **Dependency**: Required for consent persistence

### Environment Variables
- **Interface**: `process.env`
- **Data Exchange**: `SPECSMD_TELEMETRY_DISABLED`, `DO_NOT_TRACK`, `CI`
- **Dependency**: Optional overrides

---

## Integration Points

### Installer CLI ↔ Analytics Module
```
Installation starts
  → Check consent state
  → If consented: collect events
  → On completion: batch send events
  → Continue installation regardless
```

### Analytics Module ↔ Backend
```
Events collected
  → Serialize to JSON
  → POST to endpoint (2s timeout)
  → Accept success or failure silently
  → No retries, no queuing
```

### Consent Manager ↔ Local Storage
```
First run
  → Check ~/.specsmd/telemetry-consent
  → If missing: prompt user
  → Store preference
  → Never prompt again
```

---

## Context Diagram

```
                    ┌─────────────────────┐
                    │   AI-Native Engineer │
                    └──────────┬──────────┘
                               │ runs installer
                               ▼
                    ┌──────────────────────┐
                    │   Installer CLI       │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │ Consent Manager │  │
                    │  ├─────────────────┤  │
                    │  │ Event Collector │  │
                    │  ├─────────────────┤  │
                    │  │ Event Sender    │  │
                    │  └─────────────────┘  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Local Storage  │  │  Environment    │  │  Analytics      │
│                 │  │  Variables      │  │  Backend        │
│  ~/.specsmd/    │  │                 │  │  (specs.md)   │
│  telemetry-     │  │  - CI           │  │                 │
│  consent        │  │  - DO_NOT_TRACK │  │  POST /api/     │
│                 │  │  - SPECSMD_...  │  │  analytics/     │
└─────────────────┘  └─────────────────┘  │  events         │
                                          └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  specs.md Team  │
                                          │  Dashboard      │
                                          └─────────────────┘
```

---

## Constraints

### Technical Constraints
- Must work offline (graceful degradation)
- Must not add significant latency (<100ms)
- Must work across all supported platforms (macOS, Linux, Windows)
- Must not require additional dependencies if possible

### Privacy Constraints
- GDPR compliance required
- No PII collection
- Opt-in only
- Clear disclosure of what is collected

### Operational Constraints
- Analytics backend infrastructure not yet built
- Need simple solution that can be implemented quickly
- Budget constraints for hosted analytics services

---

## Data Flow

### Happy Path (Consent Given)
```
1. User runs: npx @specs.md/specsmd
2. Installer checks ~/.specsmd/telemetry-consent → not found
3. Installer prompts: "Help improve specsmd? (anonymous usage stats) [y/N]"
4. User types: y
5. Consent stored: ~/.specsmd/telemetry-consent → "opted-in"
6. Event collected: installer_started
7. User selects IDE → Event collected: ide_selected
8. User selects flow → Event collected: flow_selected
9. Installation completes → Event collected: installation_completed
10. Events batched and sent via HTTPS POST
11. Response ignored (success or failure)
```

### Opt-Out Path
```
1. User runs: npx @specs.md/specsmd --no-telemetry
2. Telemetry disabled for this session
3. No consent prompt shown
4. No events collected
5. Installation proceeds normally
```

### CI Detection Path
```
1. CI runs: npx @specs.md/specsmd
2. Installer detects CI=true environment variable
3. Telemetry auto-disabled
4. No consent prompt shown
5. No events collected
6. Installation proceeds normally
```

---

## Quality Attributes

### Privacy
- Privacy by design, not as an afterthought
- Minimal data collection principle
- Anonymous by default

### Reliability
- Never break installation
- Silent failures
- Offline-capable

### Transparency
- Open source implementation
- Clear documentation
- Auditable data collection
