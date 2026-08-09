---
id: 000-flow-evals
title: Evals and verifiers exist before the flow is implemented
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: []
created: 2026-08-09
---

# Evals and verifiers exist before the flow is implemented

Before any part of the unified flow is built, the means of judging it exist. The flow's own specs are verified for sufficiency, and every later work item is implemented against checks that already exist. This inverts the usual order deliberately: a spec whose sufficiency is untested is an assumption, not a contract.

## Behavior

- **Spec-sufficiency verification**: given a work-item spec, an independent implementer (an agent with access to the spec only — no conversation history, no reference implementation) produces an implementation; a separate judge compares its observable behavior against the spec's Definition of Done and reports gaps and ambiguities as proposed spec corrections. Two independent implement-from-spec runs whose observable behavior diverges indicate ambiguity at the point of divergence.
- **Conformance checking**: every Definition of Done across the intent's work items can be evaluated, and the result honestly distinguishes machine-verified criteria from criteria needing human or scenario judgment. A criterion that cannot be evaluated at all is reported as a spec defect, not silently skipped.
- **Trigger evals**: for each model-invocable skill the flow ships, a set of canonical user prompts maps to the skill expected to activate; the evals report activation accuracy and mis-routing.
- **Holdout scenarios**: end-to-end acceptance scenarios are stored where implementing agents cannot modify them; evaluation judges whether observed behavior satisfies the scenario, not whether a test asserted true.

## Out of scope

Continuous/scheduled execution of these evals (attaches later to the repository's automation); evals for the legacy flows.

## Definition of Done

- [ ] (gating) Running spec-sufficiency verification against any work item in this intent produces a written report of gaps, ambiguities, and proposed corrections.
- [ ] (gating) Conformance checking over this intent reports, per criterion: verified / failed / needs-human, with an overall coverage summary.
- [ ] (gating) Trigger evals run against the flow's model-invocable skill descriptions and report per-prompt routing outcomes.
- [ ] (gating) Holdout scenarios are unreadable-as-writable by implementing agents *(readable for evaluation only)*.
- [ ] (advisory) Work items 001–010 have each been through at least one sufficiency pass before their implementation starts.
