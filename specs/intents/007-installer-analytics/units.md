# Units: Installer Event Tracking

## Unit Breakdown

| Unit | Description | Priority | Dependencies |
|------|-------------|----------|--------------|
| **consent-manager** | Handles user consent for analytics | High | None |
| **event-collector** | Collects and structures analytics events | High | consent-manager |
| **event-sender** | Transmits events to analytics backend | High | event-collector |
| **analytics-backend** | Receives and stores analytics events | Medium | None (independent) |

---

## Unit 1: consent-manager

### Responsibility
Manage user consent state for analytics collection. Handle prompting, persistence, and environment variable overrides.

### Stories
1. As an installer, I need to check if user has previously consented so I don't re-prompt
2. As an installer, I need to prompt first-time users for consent
3. As an installer, I need to persist consent preference locally
4. As an installer, I need to respect `--no-telemetry` flag
5. As an installer, I need to detect CI environments and auto-disable
6. As an installer, I need to respect `SPECSMD_TELEMETRY_DISABLED` env var
7. As an installer, I need to respect `DO_NOT_TRACK` env var

### Key Interfaces
```typescript
interface ConsentManager {
  checkConsent(): Promise<ConsentState>;
  promptForConsent(): Promise<boolean>;
  isDisabledByEnvironment(): boolean;
  isRunningInCI(): boolean;
}

type ConsentState = 'opted-in' | 'opted-out' | 'unknown';
```

### Acceptance Criteria
- Consent prompt shown only once per machine
- All environment overrides respected
- CI detection covers major CI providers

---

## Unit 2: event-collector

### Responsibility
Collect analytics events during installation, structure them according to schema, and hold them for batch transmission.

### Stories
1. As an installer, I need to generate a session ID for this install attempt
2. As an installer, I need to collect `installer_started` event
3. As an installer, I need to collect `ide_selected` event with IDE choice
4. As an installer, I need to collect `flow_selected` event with flow choice
5. As an installer, I need to collect `installation_completed` event
6. As an installer, I need to collect `installation_error` event on failures
7. As an installer, I need to collect environment metadata (OS, Node version)

### Key Interfaces
```typescript
interface EventCollector {
  startSession(): void;
  track(event: AnalyticsEvent): void;
  getEvents(): AnalyticsEvent[];
  clear(): void;
}

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  sessionId: string;
  version: string;
  [key: string]: unknown;
}
```

### Acceptance Criteria
- All specified events are collected
- Events follow schema exactly
- No PII in any event
- Session ID is random UUID

---

## Unit 3: event-sender

### Responsibility
Transmit collected events to the analytics backend. Handle failures gracefully.

### Stories
1. As an installer, I need to batch events and send them together
2. As an installer, I need to send events via HTTPS POST
3. As an installer, I need to timeout requests after 2 seconds
4. As an installer, I need to ignore transmission failures silently
5. As an installer, I need to not block installation on analytics

### Key Interfaces
```typescript
interface EventSender {
  send(events: AnalyticsEvent[]): Promise<void>;
}

// Configuration
const ANALYTICS_ENDPOINT = 'https://specs.md/api/analytics/events';
const TIMEOUT_MS = 2000;
```

### Acceptance Criteria
- Events sent as single batch POST
- 2 second timeout enforced
- Failures do not surface to user
- Installation never blocked by analytics

---

## Unit 4: analytics-backend

### Responsibility
Receive, validate, store, and aggregate analytics events. Provide dashboard for specs.md team.

### Stories
1. As a backend, I need to receive POST requests with event batches
2. As a backend, I need to validate events against schema
3. As a backend, I need to store events in time-series database
4. As a backend, I need to aggregate events for dashboard
5. As a backend, I need to NOT store IP addresses
6. As a team member, I need to view installation metrics dashboard

### Key Interfaces
```typescript
// API Endpoint
POST /api/analytics/events
Content-Type: application/json
Body: { events: AnalyticsEvent[] }
Response: 204 No Content (always, even on validation errors)
```

### Acceptance Criteria
- Endpoint accepts event batches
- IP addresses not logged/stored
- Dashboard shows key metrics
- 99.9% uptime target

### Implementation Note
This unit may be implemented using a simple serverless function (Vercel, Cloudflare Workers) with a lightweight database (Supabase, PlanetScale) to minimize operational overhead.

---

## Dependency Graph

```
┌─────────────────┐
│ consent-manager │ ← Check first
└────────┬────────┘
         │ if consented
         ▼
┌─────────────────┐
│ event-collector │ ← Collect during install
└────────┬────────┘
         │ on completion
         ▼
┌─────────────────┐     ┌──────────────────┐
│  event-sender   │────▶│ analytics-backend │
└─────────────────┘     └──────────────────┘
```

---

## Implementation Priority

1. **Phase 1**: consent-manager + event-collector (can log events locally for testing)
2. **Phase 2**: event-sender + analytics-backend (enable actual collection)
3. **Phase 3**: Dashboard and metrics visualization
