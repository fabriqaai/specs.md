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

Turn an intent into vertical slices. Each slice is independently valuable observable behavior, not a layer (not "the schema" then "the API" then "the UI").

## Assess

Complexity is decision load, not file count:

- `low` — no new correctness or interoperability decisions
- `medium` — local decisions inside an existing shape
- `high` — new cross-cutting decisions

Default complexity when unstated: `medium`.

Suggested ceremony comes from the contract matrix (complexity × the project's autonomy bias). The script records it as `ceremony_suggested`. The user may override it later at bolt start.

## Acceptance criteria

Every work item ends in a Definition of Done. Criteria are behavioral and marked `(gating)` or `(advisory)`. An internal-attribute criterion (names a module, function, or "add a validator") is flagged in the item as `flag: internal-attribute` and does not block writing.

Follow `references/nlspec.md` in the `flow-runtime` skill.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill. For each item:

```text
node {SCRIPTS_DIR}/init-work-item.cjs {projectRoot} --intent {intentId} --title "{title}" --complexity {low|medium|high} --depends-on {id,id} --body-file {temp}
```

If the script refuses a dependency cycle, it names the cycle. Write nothing else from that invocation. Use `references/work-item.md` as the body shape.

A one-line intent still decomposes; say which brief sections are thin.

## Close

List the work items that now exist. Offer — without requiring — `bolt-start` or `bolt-plan`. Do not invoke them.
