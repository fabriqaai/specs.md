---
name: bolt-start
description: Use when shaped work is ready to execute or the user wants to start a bolt. Creates a bolt over one or more work items with a recipe and ceremony level.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Start a bolt

Creates the execution container. Recipe and ceremony are recorded at creation and do not change.

## Scope

Offer: a single work item, a batch, or an existing draft.

If drafts exist, present exactly three options first: **adopt** a listed draft, **modify** a listed draft, **ignore** drafts for this start. Dismissing the prompt is ignore.

- **Adopt** — `--adopt-draft {id}`
- **Modify** — pass the edited `--work-items` and `--recipe`; do not pass `--adopt-draft` unless the user wants the draft consumed
- **Ignore** — pass `--work-items` only

A bolt may group work items from more than one intent. If the chosen items' dependencies cycle, the script refuses and names the cycle.

## Ceremony

Values: `autopilot`, `confirm`, `validate`. If the user does not pick one, omit `--ceremony` and the script derives it from the items' complexity and the project's autonomy bias. The user's explicit choice always wins.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill:

```text
node {SCRIPTS_DIR}/init-bolt.cjs {projectRoot} --work-items {id,id} --recipe default --ceremony confirm
```

Do not mkdir a bolt folder yourself.

## Close

State the bolt id, recipe, ceremony, current stage, and whether a gate is awaiting. Offer — without requiring — `bolt-execute`.
