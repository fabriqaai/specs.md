---
work_item: 000-flow-evals
intent: 001-unified-bolt-flow
complexity: high
protocol: triangulation
sufficiency: not-cleared
recorded_at: 2026-08-13T11:40:25Z
---

# Sufficiency report: 000-flow-evals

Protocol: triangulation (high complexity).

## Outcome

not-cleared

## Notes

The first implementation of this spec was a single self-probe. A second isolated implement-from-spec-only probe was not run. That is an open divergence against the high-complexity protocol, not named freedom.

## Probes

- P1 — isolated: no

This repository's first evals harness records findings, walks Definition of Done checkboxes, scores trigger fixtures, and rejects mixed evals/implementation path changes. It does not spawn probe implementers.

## Judge

One probe is present and it is not isolated. The high-complexity protocol requires two isolated probes. Interchangeability is untested.

## Findings

### F1 — named-freedom (resolved)

Sufficiency report location is not specified

The spec requires the outcome and report to be recorded with the work item but does not name a path.

Resolution: Reports live at docs/specsmd/intents/{intent}/sufficiency/{id}.md and the work item records sufficiency plus sufficiency_report.

### F2 — named-freedom (resolved)

Trigger scoring method is unspecified once skill files exist

The spec requires per-prompt routing outcomes against skill descriptions. It does not prescribe a scorer.

Resolution: Fixtures name signature phrases that must remain in the shipped description. A prompt passes when those phrases still exist, it does not quote another skill's signatures, and unique vocabulary from the expected skill wins. This is not a model router.

### F3 — named-freedom (resolved)

Flow implementation path set for holdout is unspecified

The spec forbids changing flow implementation and evals in the same contribution. The implementation root is not named.

Resolution: Holdout treats plugins/specsmd/ as the unified-flow implementation tree (not plugins/specsmd-*). Evals-side paths are evals/, src/__tests__/evals/, and .github/workflows/evals-holdout.yml.

### F4 — divergence (open)

Second isolated triangulation probe was not run

High complexity requires two implement-from-spec-only probes and a judge comparison. Only one non-isolated self-probe exists. Two implementers could still diverge on report location (now named), trigger method (now named), and what "holdout scenarios judged on satisfaction" means in the absence of the flow (now supplied as scenarios that call the shipped scripts). The missing second probe remains a divergence: interchangeability of the spec itself is untested.

## Pass bar

Not cleared: unresolved blocking findings remain.
- F4: Second isolated triangulation probe was not run
