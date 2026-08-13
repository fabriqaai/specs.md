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

Creates the execution container when work starts. Recipe and ceremony are recorded at creation and do not change.

## Scope

Calculate three offers from pending (not-on-an-active-bolt) work items — this is the dynamic grouping:

1. **Single** — one item
2. **Batch** — items that share ceremony, or that the user names
3. **Wide** — all compatible pending items in dependency order, one bolt

Recommend from autonomy bias (`autonomous` → wide, `controlled` → single, `balanced` → batch if more than two items). If `docs/specsmd/project.md` has `grouping_history` with three matching choices, pre-select that offer. The user may pick any offer or a custom set.

If drafts exist, present exactly three options first: **adopt** a listed draft, **modify** a listed draft, **ignore** drafts for this start. Dismissing the prompt is **ignore**.

- **Adopt** — copy the draft's work items and recipe; set the draft to `abandoned`
- **Modify** — use the edited work items and recipe; leave the draft unless the user wants it consumed
- **Ignore** — start from the chosen items; drafts stay `draft`

A bolt may group work items from more than one intent. If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

## Ceremony

Values and gates live in `references/flow-contract.yaml` in the `flow-runtime` skill (`ceremony.values` and `ceremony.gates`):

- `autopilot` — no gates
- `confirm` — the recipe's first gateable stage waits
- `validate` — every gateable stage waits

If the user does not pick one, use the most controlled `ceremony_suggested` among the chosen items. The user's explicit choice always wins.

Recipe: omit a recipe pick to take the complexity recommendation, or use a shipped or project-local id.

## Write

Create `docs/specsmd/bolts/{id}/bolt.md`. Snapshot the recipe YAML into `recipe_snapshot`.

```yaml
id: {id}
status: active
recipe: {id}
recipe_snapshot: {full recipe object}
ceremony: autopilot|confirm|validate
current_stage: {first stage id}
stages_completed: []
checkpoint_state: awaiting|not-required   # awaiting if first stage is gateable under this ceremony
work_items: [{id}, {id}]
created: {ISO-8601}
```

Set each named work item to `status: active`. Set the owning intent(s) to `active` if they were `pending`. Append this grouping choice to `grouping_history` on `project.md`.

## Close

State the bolt id, recipe, ceremony, current stage, and whether a gate is awaiting. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/bolts/{id}/bolt.md`

Declinable next (none required):
- `bolt-execute` — run the recipe
- `walkthrough-generate` — if the bolt is already ready to complete
- `specsmd-status` — re-orient
