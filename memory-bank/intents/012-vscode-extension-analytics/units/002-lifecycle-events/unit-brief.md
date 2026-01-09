---
unit: 002-lifecycle-events
intent: 012-vscode-extension-analytics
phase: inception
status: complete
created: 2025-01-08T12:20:00.000Z
updated: 2025-01-08T12:20:00.000Z
---

# Unit Brief: Lifecycle Events

## Purpose

Implement extension lifecycle event tracking including activation, welcome view funnel, and error capture. These events form the critical adoption and onboarding funnel metrics.

## Scope

### In Scope
- `extension_activated` event (with is_specsmd_project, is_first_activation)
- Welcome view funnel events (displayed, install clicked, copy command, website, completed)
- `extension_error` event with categorization
- First-activation detection via globalState
- Integration with extension.ts and WelcomeViewProvider

### Out of Scope
- Analytics core/tracker (handled by 001-analytics-core)
- Feature engagement events (handled by 003-engagement-events)
- Project metrics (handled by 004-project-metrics)

---

## Assigned Requirements

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-4 | Lifecycle Events | Must |
| FR-5 | Welcome View Funnel Events | Must |
| FR-7 | Error Tracking | Should |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| ActivationEvent | Extension activated | is_specsmd_project, is_first_activation, activation_trigger |
| WelcomeEvent | Welcome view interaction | event type (displayed, install, copy, website, completed) |
| ErrorEvent | Captured error | error_category, error_code, component, recoverable |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| trackActivation() | Track extension activated | context, isProject | void |
| trackWelcomeDisplayed() | Track welcome view shown | hasWorkspace | void |
| trackWelcomeInstallClicked() | Track install button click | none | void |
| trackWelcomeCompleted() | Track successful install | durationMs | void |
| trackError() | Track categorized error | category, code, component | void |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 4 |
| Must Have | 3 |
| Should Have | 1 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Track extension activation | Must | Planned |
| 002 | Track welcome view funnel | Must | Planned |
| 003 | Detect first-time installation | Must | Planned |
| 004 | Track and categorize errors | Should | Planned |

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
| VS Code globalState | First-activation persistence | None |

---

## Technical Context

### Suggested Technology
- TypeScript
- VS Code Extension API (globalState, workspace)

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| extension.ts | Hook | activate() function |
| WelcomeViewProvider | Hook | message handlers |
| Error boundaries | Wrapper | try-catch blocks |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| hasActivatedBefore | globalState | 1 boolean | Persistent |

---

## Constraints

- Welcome events must not delay user interaction
- Error tracking must sanitize all error info (no paths/traces)
- First-activation detection must be reliable across extension updates

---

## Success Criteria

### Functional
- [ ] extension_activated fires on every activation
- [ ] is_first_activation is true only once per machine
- [ ] All welcome funnel events fire correctly
- [ ] Errors are categorized and tracked

### Non-Functional
- [ ] Events are non-blocking
- [ ] No user-identifiable info in error events

### Quality
- [ ] Code coverage > 80%
- [ ] Funnel events testable in isolation

---

## Bolt Suggestions

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-lifecycle-events | Simple | S1-S4 | All lifecycle event tracking |

---

## Notes

Integration points are well-defined: extension.ts for activation, WelcomeViewProvider for funnel. Error tracking requires adding try-catch wrappers to key components.
