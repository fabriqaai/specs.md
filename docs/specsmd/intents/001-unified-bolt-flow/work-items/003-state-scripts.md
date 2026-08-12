---
id: 003-state-scripts
title: State changes are trustworthy — tooling-owned, gated, resumable
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [001-flow-schema, 002-recipe-catalog]
created: 2026-08-09
sufficiency: dogfood-cleared
sufficiency_date: 2026-08-13
---

# State changes are trustworthy — tooling-owned, gated, resumable

All state mutation goes through the flow's own tooling. Because state is trustworthy, everything downstream — resuming, routing, completion, reporting — can rely on it without re-deriving the world from scratch.

## Behavior

- Creating a bolt, advancing its stage, recording a checkpoint decision, and completing work happen only through the flow's tooling. The tooling maintains the status cascade: completing a bolt updates its work items; a work item's status is reflected in its intent's status.
- **Completion is goal-gated**: completing is refused while the bolt's recipe-required evidence is missing or a gating acceptance criterion is unmet. The refusal message states exactly what is missing and how to produce it *(a remediation instruction, not a diagnostic dump)*. An explicit override exists; using it is recorded in the bolt's state as an override.
- **Resume is state-derived**: an interrupted bolt resumes from its recorded stage and checkpoint state — never inferred from which artifact files happen to exist.
- Failures are typed: a retryable condition (transient), a terminal condition (needs a different input), and a structural condition (the artifact tree itself is invalid) produce distinguishable outcomes, and retry effort is never spent on terminal or structural conditions.
- The tooling leaves user projects untouched: it installs nothing into the project, requires nothing of the project's language or package manager, and writes only within the flow's artifact root.
- Checkpoint decisions accept the natural vocabulary of approval ("yes", "approved", "go ahead") and normalize it; save-then-resume produces the same continuation as never having stopped.

## Out of scope

Concurrent mutation locking across parallel bolts (identifier collision-safety is in the flow contract; simultaneous edits to one bolt's state would attach here as an advisory check in the integrity validator).

## Decided defaults (dogfood slice)

Operations: init-project, init-intent, init-work-item, init-bolt (and --draft), update-stage, update-checkpoint, complete-bolt (--force override), status (read-only).

- Cascade on complete: listed work items → `complete`; intent → `complete` if all its items are terminal, else `active` if any are pending/active, else `abandoned` if all abandoned.
- Completion oracle: every `completion_requires` file exists; every listed work item has no unchecked `- [ ] (gating)` line. Walkthrough may not contain a language-tagged fence. `--force` skips the oracle and records `override: true`.
- Ceremony defaults: see the matrix in the flow contract. Omitted ceremony is derived. Approval phrases in the contract normalize to `granted`; deny phrases leave the gate `awaiting`.
- Failures: `retryable` exit 1, `terminal` exit 2, `structural` exit 3. Each carries `remediation`.
- Resume uses `current_stage` + `checkpoint_state` only. Concurrent writes to one bolt: last writer wins *(named freedom)*.

## Definition of Done

- [ ] (gating) A bolt completed through the tooling cascades: bolt complete → its work items complete → intent status reflects it.
- [ ] (gating) Completing a bolt with missing required evidence is refused, and the refusal names the missing evidence and the action that produces it.
- [ ] (gating) An override of a refused completion succeeds and is visible in the bolt's recorded state afterward.
- [ ] (gating) A bolt interrupted mid-stage resumes at its recorded stage even when later-stage artifact files exist on disk *(state wins over file existence)*.
- [ ] (gating) Running the flow's tooling in a project with no package manifest of any kind succeeds and modifies nothing outside the artifact root.
- [ ] (advisory) Fifteen common approval phrasings normalize to the intended checkpoint state.
