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

A draft is a proposal: work items plus a suggested recipe. It is not an execution container.

## Process

1. Read existing work items and any existing drafts via `scripts/status.cjs` in the `flow-runtime` skill.
2. Propose a grouping and a recipe. The shipped recipe in this slice is `default` (plan → execute → test → review). A project-local recipe file in `docs/specsmd/recipes/` is also selectable.
3. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill:

```text
node {SCRIPTS_DIR}/init-bolt.cjs {projectRoot} --draft --work-items {id,id} --recipe default
```

## Close

List the draft. Offer — without requiring — `bolt-start`. Unadopted drafts stay until someone adopts or abandons them.
