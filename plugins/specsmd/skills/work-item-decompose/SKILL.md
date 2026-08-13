---
name: work-item-decompose
description: Use when an intent exists and needs executable work items. Decomposes an intent into vertical slices with behavioral acceptance criteria and dependencies.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Decompose an intent

Turn an intent into vertical slices. Each slice is independently valuable observable behavior, not a layer (not "the schema" then "the API" then "the UI"). Invocable at any time — a one-line intent still decomposes; say which brief sections are thin.

Follow `references/nlspec.md` in the `flow-runtime` skill. If two readings are interchangeable to a caller, pick one and name it. If they are not, ask.

## Assess

Complexity is decision load, not file count:

- `low` — no new correctness or interoperability decisions
- `medium` — local decisions inside an existing shape
- `high` — new cross-cutting decisions

Default complexity when unstated: `medium`.

Suggested ceremony comes from `ceremony.matrix` in `references/flow-contract.yaml` in the `flow-runtime` skill (complexity × the project's autonomy bias). Unset bias is `balanced`. Record the result as `ceremony_suggested`. The user may override it later at bolt start. Do not copy the matrix into the work item.

## Acceptance criteria

Every work item ends in a Definition of Done. Criteria are behavioral and marked `(gating)` or `(advisory)`. An internal-attribute criterion (names a module, function, or "add a validator") is flagged on that line as `flag: internal-attribute` and does not block writing.

Use `references/work-item.md` as the body shape.

## Write

Create `docs/specsmd/intents/{intentId}/work-items/{nnn}-{slug}.md`. Next `{nnn}` is global across all intents (highest existing + 1).

Frontmatter:

```yaml
id: {nnn}-{slug}
title: {title}
intent: {intentId}
complexity: low|medium|high
ceremony_suggested: autopilot|confirm|validate
status: pending
depends_on: []
created: {ISO-8601}
```

Refuse a dependency cycle: if A depends on B and B on A, write nothing for that item and name the cycle as an ordered id list.

## Close

List the work items that now exist. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{intentId}/work-items/{id}.md` (each item; `ceremony_suggested` recorded)

Declinable next (none required):
- `bolt-start` — execute one item or a batch
- `bolt-plan` — draft a grouping first
- `specsmd-status` — re-orient
