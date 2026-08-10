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

### Sufficiency checks (tiered by complexity)
- Every work item receives a sufficiency check before its implementation starts; the check's rigor follows the spec's recorded complexity.
- **High complexity — triangulation**: an independent implementer (an agent with access to the spec and the flow's standards only — no conversation history, no reference implementation) produces an implementation; a separate judge compares its observable behavior against the spec's Definition of Done and reports gaps, ambiguities, and contradictions as proposed spec corrections. Two triangulation runs whose observable behavior diverges indicate ambiguity at the point of divergence.
- **Medium and low complexity — adversarial review**: a skeptic agent, given the spec alone, hunts for readings that would make two implementers diverge, contradictions, missing defaults, and untestable criteria — without implementing.
- **The pass bar**: a spec passes when no divergence-causing finding remains — every ambiguity that would make two implementers diverge, and every contradiction, is either resolved in the spec or converted into named intentional freedom. Advisory findings (style, completeness suggestions) may remain open. Full conformance of the probe implementation is *not* the bar; interchangeability is.
- The check's outcome — pass or outstanding findings, with the report — is recorded with the work item, so "this spec is cleared for implementation" is answerable from the artifact tree.

### Conformance checking
- Every Definition of Done across the intent's work items can be evaluated, and the result honestly distinguishes machine-verified criteria from criteria needing human or scenario judgment. A criterion that cannot be evaluated at all is reported as a spec defect, not silently skipped.

### Trigger evals
- For each model-invocable skill the flow ships, a set of canonical user prompts maps to the skill expected to activate; the evals report activation accuracy and mis-routing.

### Holdout integrity
- Eval definitions and end-to-end holdout scenarios live in a dedicated top-level evals area of the repository, visible and reviewable like everything else. Implementing agents work in isolation from it: a change that implements flow behavior and touches the evals area in the same contribution is rejected automatically before merge. Evaluation reads the evals area; implementation never writes it.
- Holdout scenarios are judged on satisfaction — whether observed behavior satisfies the scenario — not on whether a test asserted true.

## Out of scope

Continuous/scheduled execution of these evals (attaches to the repository's automation). Evals for the legacy flows. Sufficiency checking of specs outside this intent (the same machinery would attach per-intent as the flow is used for other projects).

## Definition of Done

- [ ] (gating) Running the sufficiency check against any work item in this intent produces a recorded report of gaps, ambiguities, and proposed corrections, at the rigor its complexity calls for.
- [ ] (gating) A spec with an unresolved divergence-causing finding reports as not-cleared; resolving the finding (or naming it intentional freedom) flips it to cleared *(the state is answerable from the artifact tree)*.
- [ ] (gating) Conformance checking over this intent reports, per criterion: verified / failed / needs-human, with an overall coverage summary.
- [ ] (gating) Trigger evals run against the flow's model-invocable skill descriptions and report per-prompt routing outcomes.
- [ ] (gating) A contribution that changes flow implementation and the evals area together is rejected before merge; a contribution changing only one or the other passes.
- [ ] (advisory) Work items 001–012 have each been through their sufficiency pass before their implementation starts.
