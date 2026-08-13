---
name: bolt-plan
description: Use when the user wants to propose a grouping of work items before execution. Writes a draft bolt; starting a bolt may adopt, modify, or ignore it.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Draft a bolt

A draft is a proposal: work items plus a suggested recipe. It is not an execution container. Starting a bolt may **adopt**, **modify**, or **ignore** it. Unadopted drafts stay until someone adopts or abandons them.

## Process

1. Read existing work items and drafts via `scripts/status.cjs` in the `flow-runtime` skill.
2. Propose a grouping and a recipe. Shipped recipes are `default`, `ddd`, `spike`, and `simple` (ids and stages live in the recipe files). A project-local recipe in `docs/specsmd/recipes/` is also selectable. If the user does not pick a recipe, omit `--recipe` and the script recommends from complexity (`recipe.recommend_from_complexity` in `references/flow-contract.yaml` in the `flow-runtime` skill).
3. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill:

```text
node {SCRIPTS_DIR}/init-bolt.cjs {projectRoot} --draft --work-items {id,id}
node {SCRIPTS_DIR}/init-bolt.cjs {projectRoot} --draft --work-items {id,id} --recipe ddd
```

If the script refuses a dependency cycle, it names the cycle. Write nothing else from that invocation.

## Close

List the draft. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/bolts/{id}/bolt.md` (status `draft`)

Declinable next (none required):
- `bolt-start` — adopt, modify, or ignore this draft
- `work-item-decompose` — add slices before starting
- `specsmd-status` — re-orient
