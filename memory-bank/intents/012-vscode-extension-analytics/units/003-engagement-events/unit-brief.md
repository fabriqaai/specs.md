---
unit: 003-engagement-events
intent: 012-vscode-extension-analytics
phase: inception
status: complete
created: 2025-01-08T12:20:00.000Z
updated: 2025-01-08T12:20:00.000Z
---

# Unit Brief: Engagement Events

## Purpose

Track user engagement with the specsmd explorer view, including tab navigation, bolt interactions, artifact access, and filter usage. These events reveal which features provide the most value.

## Scope

### In Scope
- `tab_changed` event (from_tab, to_tab)
- `bolt_action` event (start, continue, view_files, open_md)
- `artifact_opened` event (type, source)
- `filter_changed` event (activity filter, specs filter)
- Integration with SpecsmdWebviewProvider message handlers

### Out of Scope
- Analytics core (001-analytics-core)
- Lifecycle events (002-lifecycle-events)
- Project metrics (004-project-metrics)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-6 | Engagement Events | Should |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| TabChangeEvent | User switched tabs | from_tab, to_tab |
| BoltActionEvent | User interacted with bolt | action, bolt_type, bolt_status |
| ArtifactOpenedEvent | User opened an artifact | artifact_type, source |
| FilterChangedEvent | User changed a filter | filter_type, filter_value |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| trackTabChange() | Track tab navigation | fromTab, toTab | void |
| trackBoltAction() | Track bolt interaction | action, boltType, status | void |
| trackArtifactOpened() | Track file opened | type, source | void |
| trackFilterChanged() | Track filter change | filterType, value | void |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 4 |
| Must Have | 0 |
| Should Have | 4 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Track tab navigation | Should | Planned |
| 002 | Track bolt actions | Should | Planned |
| 003 | Track artifact opened | Should | Planned |
| 004 | Track filter changes | Should | Planned |

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
| None | All internal | None |

---

## Technical Context

### Suggested Technology
- TypeScript
- Webview message handling

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| SpecsmdWebviewProvider | Hook | _handleMessage() |
| webviewMessaging.ts | Types | Message types |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| None | N/A | N/A | N/A |

---

## Constraints

- Events must not include file paths or content
- Bolt type should be normalized (DDD, Simple, Spike)
- Tab names should be consistent (bolts, specs, overview)

---

## Success Criteria

### Functional
- [ ] Tab changes tracked with from/to
- [ ] All bolt actions tracked with context
- [ ] Artifact opens tracked with type classification
- [ ] Filter changes tracked

### Non-Functional
- [ ] No blocking of UI interactions
- [ ] No sensitive data in events

### Quality
- [ ] Code coverage > 80%
- [ ] Events follow consistent naming

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-engagement-events | Simple | S1-S4 | All engagement event tracking |

---

## Notes

All integration points are in SpecsmdWebviewProvider._handleMessage(). Add tracking calls to existing message handlers.
