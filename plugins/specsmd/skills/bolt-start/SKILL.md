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

If drafts exist, present exactly three options first: **adopt** a listed draft, **modify** a listed draft, **ignore** drafts for this start. Dismissing the prompt is **ignore**.

- **Adopt** — `--adopt-draft {id}` (consumes the draft; it becomes `abandoned`)
- **Modify** — pass the edited `--work-items` and `--recipe`; do not pass `--adopt-draft` unless the user wants the draft consumed
- **Ignore** — pass `--work-items` only; drafts stay `draft`

A bolt may group work items from more than one intent. If the chosen items' dependencies cycle, the script refuses and names the cycle. Write nothing else from that invocation.

## Ceremony

Values and gates live in `references/flow-contract.yaml` in the `flow-runtime` skill (`ceremony.values` and `ceremony.gates`):

- `autopilot` — no gates
- `confirm` — the recipe's first gateable stage waits
- `validate` — every gateable stage waits

If the user does not pick one, omit `--ceremony` and the script uses the most controlled `ceremony_suggested` among the chosen items. The user's explicit choice always wins.

Recipe: omit `--recipe` to take the complexity recommendation, or pass a shipped or project-local id.

## Write via script

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill:

```text
node {SCRIPTS_DIR}/init-bolt.cjs {projectRoot} --work-items {id,id} --recipe default --ceremony confirm
```

Do not mkdir a bolt folder yourself.

## Close

State the bolt id, recipe, ceremony, current stage, and whether a gate is awaiting. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/bolts/{id}/bolt.md`

Declinable next (none required):
- `bolt-execute` — run the recipe
- `walkthrough-generate` — if the bolt is already ready to complete
- `specsmd-status` — re-orient
