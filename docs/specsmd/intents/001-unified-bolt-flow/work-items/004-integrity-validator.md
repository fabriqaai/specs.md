---
id: 004-integrity-validator
title: Drift between artifacts is detected, explained, and repaired with consent
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [003-state-scripts]
created: 2026-08-09
---

# Drift between artifacts is detected, explained, and repaired with consent

With state distributed across artifact frontmatter, drift is the failure mode to defend against. Integrity validation finds every class of drift, explains each finding with a remediation, and repairs only with consent.

## Behavior

- Validation detects at least: status-cascade violations (a completed bolt whose work items are still pending), orphaned references (a bolt naming a work item that doesn't exist, a dependency naming a missing item), stale in-progress bolts (no state change beyond a declared threshold; the threshold has a default and is configurable), state values outside the flow contract's vocabulary, and identifier/location mismatches.
- Every finding carries: severity, whether it is auto-repairable, and a remediation instruction stating what to change and where.
- Nothing is repaired without consent. Consent can be granted per finding or for all auto-repairable findings at once. Every repair is recorded in a maintenance log with what changed and why.
- Validation is usable by machines and by humans: a non-interactive mode produces machine-readable findings and a meaningful exit status; an interactive mode walks findings with repair choices.
- A clean tree validates clean *(no findings invented to seem useful)*.

## Definition of Done

- [ ] (gating) Each listed drift class, introduced deliberately into a test tree, is detected and reported with severity and remediation.
- [ ] (gating) No repair occurs without consent; every performed repair appears in the maintenance log.
- [ ] (gating) Non-interactive validation of a clean tree reports zero findings and a success exit status.
- [ ] (advisory) A finding's remediation instruction is sufficient for an agent to perform the repair without further context.
