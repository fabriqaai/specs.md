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

A draft is a proposal: work items plus a suggested recipe. It is not an execution container. Starting a bolt may **adopt**, **modify**, or **ignore** it. Unadopted drafts stay until someone adopts or abandons them. Drafts are optional — `bolt-start` can group on the fly.

## Process

1. Read pending work items and existing drafts under `docs/specsmd/`.
2. Propose a grouping and a recipe. Shipped recipes are `default`, `ddd`, `spike`, and `simple`. A project-local recipe in `docs/specsmd/recipes/` is also selectable. If the user does not pick a recipe, recommend from complexity (`recipe.recommend_from_complexity` in `references/flow-contract.yaml` in the `flow-runtime` skill).
3. Write `docs/specsmd/bolts/{id}/bolt.md` with `status: draft`. Id format: `bolt-{short-slug}-{nnn}` using the next free number.

If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

## Close

List the draft. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/bolts/{id}/bolt.md` (status `draft`)

Declinable next (none required):
- `bolt-start` — adopt, modify, or ignore this draft
- `work-item-decompose` — add slices before starting
- `specsmd-status` — re-orient
