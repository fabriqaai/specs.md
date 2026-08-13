---
work_item: 002-recipe-catalog
intent: 001-unified-bolt-flow
complexity: medium
protocol: adversarial-review
sufficiency: cleared
recorded_at: 2026-08-12T22:47:05Z
---

# Sufficiency report: 002-recipe-catalog

Protocol: adversarial review (medium complexity).

## Outcome

cleared

## Notes

Adversarial review of 002-recipe-catalog after closing the dogfood-only freedoms. Per-stage produces, gateable, and constraints live in the four shipped recipe files.

## Findings

### F1 — named-freedom (resolved)

Per-stage tables live in recipe data files

Two implementers could invent different artifact names for the same stage.

Resolution: The shipped YAML files are the tables. default, ddd, spike, and simple declare produces, gateable, and constraints. This spec section does not duplicate them.

### F2 — named-freedom (resolved)

Complexity-to-recipe mapping

The original spec required a documented mapping without stating it.

Resolution: low→simple, medium→default, high→ddd. User choice always wins.

### F3 — named-freedom (resolved)

In-flight bolts snapshot the parsed recipe

Later file edits could change an active bolt if only the id was stored.

Resolution: Bolt records recipe id plus immutable recipe_snapshot at creation.

### F4 — named-freedom (resolved)

Spike time box defaults

Duration, clock start, and expiry action were unspecified.

Resolution: PT8H, on_expiry complete_with_findings, clock starts when the bolt becomes active, next tooling write writes findings.md if missing and completes through the complete path (not an override). Partial findings are valid.

### F5 — named-freedom (resolved)

Unknown constraint kinds

Two implementers could ignore or refuse unknown kinds.

Resolution: Refuse at recipe-load as a terminal error. Known kinds are time_box and no_source_code.

## Pass bar

No open divergence-causing finding remains (no open `divergence` or `contradiction`).
Advisory findings may remain open. Full probe conformance is not the bar.
