---
work_item: 000-flow-evals
intent: 001-unified-bolt-flow
complexity: high
protocol: triangulation
sufficiency: cleared
recorded_at: 2026-08-12T22:11:30Z
---

# Sufficiency report: 000-flow-evals

Protocol: triangulation (high complexity).

## Outcome

cleared

## Notes

High-complexity triangulation: this contribution is the first implement-from-spec probe. A second independent probe was not run; that residual process risk is advisory, not a spec divergence. The judge compared the harness's observable behavior to the Definition of Done (runners, recorded state, honest coverage, skipped triggers, holdout isolation).

Probe: this-implementation

Judge: dod-comparison

## Findings

### F1 — named-freedom (resolved)

Sufficiency report location is not specified

The spec requires the outcome and report to be recorded with the work item but does not name a path. Two implementers could store reports in different places and still interoperate if frontmatter sufficiency_report points at the file.

Resolution: Reports live at docs/specsmd/intents/{intent}/sufficiency/{id}.md and the work item records sufficiency plus sufficiency_report.

### F2 — named-freedom (resolved)

Trigger scoring method is unspecified once skill files exist

The spec requires per-prompt routing outcomes against skill descriptions. It does not prescribe a scorer.

Resolution: The runner uses lexical overlap of the prompt against each model-invocable skill description. A later judge model may replace the scorer without changing fixtures or outcome shape.

### F3 — named-freedom (resolved)

Flow implementation path set for holdout is unspecified

The spec forbids changing flow implementation and evals in the same contribution. The implementation root is not named.

Resolution: Holdout treats plugins/specsmd/ as the unified-flow implementation tree (not plugins/specsmd-*). Additional prefixes can be added when more implementation roots exist.

## Pass bar

No open divergence-causing finding remains (no open `divergence` or `contradiction`).
Advisory findings may remain open. Full probe conformance is not the bar.
