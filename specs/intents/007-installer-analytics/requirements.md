# Intent: Installer Event Tracking

## Overview

Implement privacy-respecting analytics to track installer usage patterns, helping the specs.md team understand adoption, IDE preferences, flow popularity, and identify friction points in the installation experience.

---

## Research Summary

### Analytics Options Evaluated

| Option | Type | Pros | Cons | Recommendation |
|--------|------|------|------|----------------|
| **Google Analytics (Measurement Protocol)** | SaaS | Free, robust, familiar | Privacy concerns, complex for CLI, cookie-based | Not recommended |
| **PostHog** | Open Source | Self-hostable, product analytics, feature flags | Requires infrastructure, overkill for simple events | Consider for future |
| **Plausible Analytics** | Open Source | Privacy-first, lightweight, GDPR compliant | Web-focused, less CLI-friendly | Not ideal for CLI |
| **Simple API Endpoint** | Custom | Full control, minimal dependencies, privacy-first | Requires hosting, build from scratch | **Recommended** |
| **Mixpanel** | SaaS | CLI-friendly SDK, good free tier | Privacy concerns, vendor lock-in | Alternative |

### Recommended Approach: Simple Custom Analytics

For CLI tools, the recommended approach is a lightweight, privacy-first custom solution:

1. **Simple HTTP endpoint** that accepts anonymous events
2. **Best-effort delivery** - send once, accept failures silently
3. **Explicit opt-in** - never collect without consent
4. **Minimal data** - only what's needed for product decisions
5. **No PII** - no IP addresses, device IDs, or user identifiers stored

Reference implementations: Angular CLI, Next.js CLI, Homebrew.

---

## Problem Statement

Currently, specsmd has no visibility into:
- How many users attempt installation
- Which IDEs/tools are most popular
- Which flows users install
- Where users abandon the installation process
- Installation success/failure rates
- Geographic distribution of users

This makes it difficult to prioritize development efforts, identify UX issues, and understand user needs.

---

## Functional Requirements

### FR-1: Event Collection

- FR-1.1: System SHALL track `installer_started` event when npx command is executed
- FR-1.2: System SHALL track `ide_selected` event with IDE choice (e.g., claude-code, cursor)
- FR-1.3: System SHALL track `flow_selected` event with flow choice (e.g., aidlc, custom)
- FR-1.4: System SHALL track `installation_completed` event with success/failure status
- FR-1.5: System SHALL track `installation_error` event with error category (not full stack trace)
- FR-1.6: System SHALL collect environment metadata (OS, Node version, package manager)

### FR-2: Privacy & Consent

- FR-2.1: System SHALL NOT collect any data without explicit user opt-in
- FR-2.2: System SHALL prompt user for analytics consent on first run
- FR-2.3: System SHALL persist consent preference locally (not require re-prompting)
- FR-2.4: System SHALL provide `--no-telemetry` flag to skip analytics silently
- FR-2.5: System SHALL NOT collect IP addresses, device IDs, or any PII
- FR-2.6: System SHALL generate anonymous session ID (random UUID per install attempt)

### FR-3: Data Transmission

- FR-3.1: System SHALL send events via HTTPS POST to analytics endpoint
- FR-3.2: System SHALL use best-effort delivery (fire-and-forget, no retries)
- FR-3.3: System SHALL NOT block installation if analytics fails
- FR-3.4: System SHALL timeout analytics requests after 2 seconds
- FR-3.5: System SHALL batch events and send on installation completion

### FR-4: Configuration

- FR-4.1: System SHALL support `SPECSMD_TELEMETRY_DISABLED=1` environment variable
- FR-4.2: System SHALL support CI detection to auto-disable telemetry
- FR-4.3: System SHALL respect `DO_NOT_TRACK` environment variable

---

## Non-Functional Requirements

### NFR-1: Performance

- Analytics collection SHALL add less than 100ms to total installation time
- Analytics transmission SHALL be non-blocking
- Analytics SHALL NOT cause installation failures

### NFR-2: Privacy

- Zero PII collection by design
- Data SHALL be aggregated, not individually identifiable
- Consent SHALL be opt-in, not opt-out

### NFR-3: Reliability

- Analytics failures SHALL be silent
- Offline installations SHALL proceed without error
- Network errors SHALL NOT surface to users

### NFR-4: Transparency

- Source code for analytics SHALL be open and auditable
- Documentation SHALL clearly describe all collected data
- Privacy policy SHALL be accessible

---

## Events Schema

### Core Events

```typescript
interface BaseEvent {
  event: string;
  timestamp: string; // ISO 8601
  sessionId: string; // Random UUID per install attempt
  version: string;   // specsmd version
}

interface InstallerStarted extends BaseEvent {
  event: 'installer_started';
  source: 'npx' | 'npm' | 'manual';
  os: 'darwin' | 'linux' | 'win32';
  nodeVersion: string; // Major only, e.g., "18"
}

interface IdeSelected extends BaseEvent {
  event: 'ide_selected';
  ide: string; // e.g., 'claude-code', 'cursor', 'windsurf'
}

interface FlowSelected extends BaseEvent {
  event: 'flow_selected';
  flow: string; // e.g., 'aidlc', 'custom'
}

interface InstallationCompleted extends BaseEvent {
  event: 'installation_completed';
  success: boolean;
  durationMs: number;
  filesCreated: number;
}

interface InstallationError extends BaseEvent {
  event: 'installation_error';
  errorCategory: string; // e.g., 'file_permission', 'network', 'validation'
}
```

---

## Success Criteria

- Analytics collection is implemented with zero impact on installation reliability
- User consent is explicitly requested and respected
- Dashboard shows meaningful metrics within 1 week of launch
- No privacy complaints or concerns raised by users
- Data enables at least 3 actionable product decisions

---

## Acceptance Criteria

### AC-1: Consent Flow
- GIVEN a first-time user running the installer
- WHEN installation starts
- THEN user is prompted for analytics consent
- AND their choice is persisted locally

### AC-2: Opt-Out Respected
- GIVEN a user who declined analytics
- WHEN they run the installer again
- THEN no analytics events are sent
- AND no consent prompt is shown

### AC-3: Environment Override
- GIVEN `SPECSMD_TELEMETRY_DISABLED=1` is set
- WHEN installer runs
- THEN no analytics events are sent
- AND no consent prompt is shown

### AC-4: Graceful Failure
- GIVEN analytics endpoint is unavailable
- WHEN installer attempts to send events
- THEN installation proceeds successfully
- AND no error is shown to user

### AC-5: CI Detection
- GIVEN installer is running in CI environment (e.g., CI=true)
- WHEN installation starts
- THEN analytics is automatically disabled
