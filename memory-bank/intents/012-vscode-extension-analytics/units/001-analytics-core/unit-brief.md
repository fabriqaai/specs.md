---
unit: 001-analytics-core
intent: 012-vscode-extension-analytics
phase: construction
status: complete
created: 2025-01-08T12:20:00Z
updated: 2025-01-09T10:50:00Z
---

# Unit Brief: Analytics Core

## Purpose

Provide the foundational analytics infrastructure for the VS Code extension, including the tracker singleton, Mixpanel integration, machine/session ID generation, IDE detection, and privacy controls. This unit establishes the base that all other analytics units depend on.

## Scope

### In Scope
- Analytics tracker singleton with Mixpanel initialization
- Machine ID generation (SHA-256 hash, consistent with npx tracker)
- Session ID generation (UUID per activation)
- IDE detection (appName normalization, host, version)
- Privacy controls (env vars, VS Code settings)
- Base properties builder
- Error isolation (try-catch wrappers)
- Generic `track()` method

### Out of Scope
- Specific event implementations (handled by other units)
- Project scanning logic
- Webview message handling

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Analytics Core Module | Must |
| FR-2 | IDE Detection | Must |
| FR-3 | Privacy Controls | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| AnalyticsTracker | Singleton tracker instance | mixpanel, enabled, machineId, sessionId, baseProperties |
| BaseProperties | Properties sent with every event | distinct_id, session_id, ide_name, ide_version, ide_host, platform, locale, extension_version |
| IDEInfo | Detected IDE information | name, version, host |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| init() | Initialize tracker with Mixpanel | ExtensionContext | boolean (enabled) |
| track() | Send event to Mixpanel | eventName, properties | void (fire-and-forget) |
| isEnabled() | Check if tracking is active | none | boolean |
| getBaseProperties() | Build base properties | none | BaseProperties |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 5 |
| Must Have | 5 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Initialize Mixpanel tracker | Must | Planned |
| 002 | Generate machine and session IDs | Must | Planned |
| 003 | Detect IDE environment | Must | Planned |
| 004 | Implement privacy controls | Must | Planned |
| 005 | Wrap all analytics in error isolation | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| None | This is the foundational unit |

### Depended By
| Unit | Reason |
|------|--------|
| 002-lifecycle-events | Uses tracker.track() for events |
| 003-engagement-events | Uses tracker.track() for events |
| 004-project-metrics | Uses tracker.track() for events |

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| Mixpanel | Event storage | Low (silent failure) |
| VS Code API | IDE detection | None |

---

## Technical Context

### Suggested Technology
- TypeScript (match extension codebase)
- Mixpanel SDK or fetch-based tracking
- VS Code Extension API (vscode.env, vscode.workspace)

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| Mixpanel EU | API | HTTPS POST |
| VS Code API | Library | Extension API |
| extension.ts | Internal | Import |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| machineId | globalState | 1 value | Persistent |
| firstActivation | globalState | 1 boolean | Persistent |

---

## Constraints

- Must use same Mixpanel token as npx installer
- Must use EU endpoint (api-eu.mixpanel.com)
- All public methods must be wrapped in try-catch
- Must not block extension activation

---

## Success Criteria

### Functional
- [ ] Tracker initializes without errors
- [ ] Machine ID is consistent across sessions
- [ ] Session ID is unique per activation
- [ ] IDE detection works for VS Code, Cursor, Windsurf, VSCodium
- [ ] Privacy opt-out is respected

### Non-Functional
- [ ] Activation overhead < 50ms
- [ ] No errors propagate to extension
- [ ] Works offline (graceful degradation)

### Quality
- [ ] Code coverage > 80%
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-analytics-core | Simple | S1-S5 | Complete analytics foundation |

---

## Notes

This unit should be implemented first as all other analytics units depend on it. Consider referencing `src/lib/analytics/` from the npx installer for patterns.
