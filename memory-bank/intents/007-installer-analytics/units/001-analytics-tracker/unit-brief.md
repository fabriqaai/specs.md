---
unit: analytics-tracker
intent: 007-installer-analytics
phase: inception
status: ready
created: 2025-12-28T12:00:00Z
updated: 2025-12-28T12:30:00Z
---

# Unit Brief: Analytics Tracker

## Purpose

Implement Mixpanel analytics integration for the specsmd installer to track anonymous usage patterns, IDE preferences, and installation behavior.

## Scope

### In Scope
- Mixpanel SDK initialization
- Machine ID generation (salted SHA-256 of hostname)
- Session ID generation (random UUID per run)
- Shell/terminal environment detection
- Event tracking (5 event types)
- Environment variable opt-out support
- Fire-and-forget event delivery

### Out of Scope
- Analytics dashboard creation (Mixpanel handles this)
- Local data persistence
- User consent prompts
- Custom analytics backend

---

## Assigned Requirements

**These FRs from the intent are assigned to this unit. Stories will be created from these.**

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Generate `distinct_id` by hashing machine hostname with salt | Must |
| FR-1.2 | Use constant salt to prevent reverse-lookup | Must |
| FR-1.3 | Generate `session_id` as random UUID per run | Must |
| FR-1.4 | Use same IDs for all events within session | Must |
| FR-1.5 | Do NOT persist any data to disk | Must |
| FR-1.6 | Do NOT collect any PII | Must |
| FR-2.1 | Track `installer_started` event | Must |
| FR-2.2 | Track `ides_confirmed` event | Must |
| FR-2.3 | Track `flow_selected` event | Must |
| FR-2.4 | Track `installation_completed` event (per IDE) | Must |
| FR-2.5 | Track `installation_failed` event | Must |
| FR-4.1-4.6 | Include base properties in all events | Must |
| FR-5.1 | Use Mixpanel Node.js SDK | Must |
| FR-5.2 | Allow Mixpanel to handle geolocation | Must |
| FR-5.3 | Use fire-and-forget pattern | Must |
| FR-6.1 | Support SPECSMD_TELEMETRY_DISABLED=1 | Must |
| FR-6.2 | Support --no-telemetry flag | Should |
| FR-6.3 | Auto-disable in CI environments | Must |
| FR-6.4 | Respect DO_NOT_TRACK=1 | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| AnalyticsTracker | Singleton that manages event tracking | mixpanel, machineId, sessionId, enabled, baseProperties |
| Event | Data sent to Mixpanel | event name, properties |
| BaseProperties | Common properties for all events | distinct_id, session_id, $os, shell, node_version, specsmd_version |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| init() | Initialize tracker with IDs | none | void |
| trackInstallerStarted() | Send installer_started event | none | void |
| trackIdesConfirmed() | Send ides_confirmed event | ides[] | void |
| trackFlowSelected() | Send flow_selected event | flow | void |
| trackInstallationCompleted() | Send completion event | ide, flow, durationMs, filesCreated | void |
| trackInstallationFailed() | Send failure event | ide, errorCategory, flow | void |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 6 |
| Must Have | 5 |
| Should Have | 1 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Initialize Mixpanel with machine and session IDs | Must | Planned |
| 002 | Detect shell environment | Must | Planned |
| 003 | Check if telemetry is disabled | Must | Planned |
| 004 | Track installer lifecycle events | Must | Planned |
| 005 | Track IDE and flow selection events | Must | Planned |
| 006 | Support --no-telemetry CLI flag | Should | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| None | Standalone module |

### Depended By
| Unit | Reason |
|------|--------|
| installer-core | Needs analytics for event tracking |

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| Mixpanel | Event storage and dashboards | Low - fire-and-forget |
| npm: mixpanel | Node.js SDK | Low - stable package |

---

## Technical Context

### Suggested Technology
- TypeScript module in `src/analytics/`
- Mixpanel Node.js SDK (`mixpanel` npm package)
- Node.js crypto module for hashing and UUID

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| Mixpanel API | HTTP | HTTPS (via SDK) |
| Installer CLI | Function call | Direct import |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| Events | Mixpanel cloud | ~5 events/install | Mixpanel default |

---

## Constraints

- Must not add noticeable latency (<50ms)
- Must work offline (silent failure)
- Must not break installation on analytics failure
- No PII collection (GDPR compliance)
- Mixpanel token embedded in source (acceptable for analytics)

---

## Success Criteria

### Functional
- [ ] Mixpanel SDK initialized with correct token
- [ ] Machine ID is consistent across runs on same machine
- [ ] Session ID is unique per run
- [ ] All 5 event types tracked correctly
- [ ] Events include all base properties

### Non-Functional
- [ ] Analytics adds <50ms to installation time
- [ ] Silent failure on network errors
- [ ] Works offline without errors

### Quality
- [ ] Unit tests for ID generation
- [ ] Unit tests for environment detection
- [ ] Integration test for event structure

---

## Bolt Suggestions

Based on stories and complexity:

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-analytics-tracker-1 | simple-construction-bolt | All | Complete analytics module |

---

## Notes

- Single bolt should be sufficient given low complexity
- Mixpanel token needs to be created in Mixpanel dashboard
- Consider adding to package.json devDependencies for testing
