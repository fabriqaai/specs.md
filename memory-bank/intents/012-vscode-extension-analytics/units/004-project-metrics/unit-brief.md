---
unit: 004-project-metrics
intent: 012-vscode-extension-analytics
phase: inception
status: complete
created: 2025-01-08T12:20:00.000Z
updated: 2025-01-08T12:20:00.000Z
---

# Unit Brief: Project Metrics

## Purpose

Track project structure and evolution through snapshot and delta events. Provides insights into how teams use specsmd (project sizes, bolt completion rates, etc.) while avoiding event spam from file watcher.

## Scope

### In Scope
- `project_snapshot` event (once per activation)
- `project_changed` event (delta-based, debounced, rate-limited)
- Entity counts (intents, units, stories, bolts)
- Bolt status breakdown (active, queued, completed, blocked)
- Aggregates (avg_units_per_intent, avg_stories_per_unit)
- Debouncing (5 seconds after file changes settle)
- Rate limiting (max 5 events per minute)

### Out of Scope
- Memory bank parsing (use existing parser)
- Analytics core (001-analytics-core)
- Other event types

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-8 | Project Metrics Events | Could |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| ProjectSnapshot | Point-in-time project state | intent_count, unit_count, story_count, bolt_count, bolt_statuses |
| ProjectDelta | Change between snapshots | change_type, deltas, new_totals |
| ProjectMetricsTracker | Stateful tracker | lastSnapshot, debounceTimer, emitTimestamps |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| trackSnapshot() | Track initial project state | model | void |
| onScanComplete() | Handle file watcher scan | model | void (debounced) |
| checkAndEmit() | Compare and emit if changed | model | void |
| isRateLimited() | Check rate limit | none | boolean |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 4 |
| Must Have | 0 |
| Should Have | 0 |
| Could Have | 4 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Track project snapshot on activation | Could | Planned |
| 002 | Track project changes with deltas | Could | Planned |
| 003 | Implement debouncing for file changes | Could | Planned |
| 004 | Implement rate limiting | Could | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| 001-analytics-core | Uses tracker.track() method |

### Depended By
| Unit | Reason |
|------|--------|
| None | Leaf unit |

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| Memory bank parser | Entity counts | None |

---

## Technical Context

### Suggested Technology
- TypeScript
- Existing scanMemoryBank() function

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| SpecsmdWebviewProvider.refresh() | Hook | After scan |
| FileWatcher | Hook | onScanComplete callback |
| StateStore | Read | Get computed values |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| lastSnapshot | Memory | 1 object | Session only |
| emitTimestamps | Memory | ~5 timestamps | Rolling window |

---

## Constraints

- Must debounce file watcher events (5 second window)
- Must rate limit to max 5 events per minute
- Must not include project names or paths
- Entity counts only, no content

---

## Success Criteria

### Functional
- [ ] Snapshot fires once on activation
- [ ] Changes only fire when counts actually change
- [ ] Debouncing prevents rapid-fire events
- [ ] Rate limiting caps at 5/minute

### Non-Functional
- [ ] No memory leaks from timer handling
- [ ] Minimal CPU overhead

### Quality
- [ ] Code coverage > 80%
- [ ] Rate limiting tested under load

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-project-metrics | Simple | S1-S4 | Project metrics with safeguards |

---

## Notes

This is the lowest priority unit (Could). Can be deferred if time-constrained. Key challenge is proper debouncing and rate limiting to prevent event spam.
