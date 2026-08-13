---
name: bolt-execute
description: Use when a bolt is in progress or an interrupted bolt should resume. Runs the bolt's recipe stages under the recorded ceremony and writes stage artifacts.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Execute a bolt

Recipe-agnostic: read the bolt's recorded recipe (`recipe` + `recipe_snapshot`) and run those stages once for the bolt — not once per work item. There is no per-stage skill. Skills never mandate a following skill.

You write stage artifacts **and** update bolt frontmatter (`current_stage`, `stages_completed`, `checkpoint_state`). Follow `references/transitions.md` in the `flow-runtime` skill.

## Resume

Read the bolt frontmatter. Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist. Gate state is answerable from that recorded state at any moment.

## Ceremony

Gates are `ceremony.gates` in `references/flow-contract.yaml` in the `flow-runtime` skill:

| Ceremony | Gates |
|---|---|
| `autopilot` | None. Write required artifacts and advance. |
| `confirm` | The recipe's first gateable stage waits. |
| `validate` | Every gateable stage waits. |

When `checkpoint_state` is `awaiting`:

1. Write the stage's required artifacts if they are not already written.
2. Emit the **full current text** of every artifact this stage produces in the same turn as the approval prompt. If the stage produces `plan.md`, emit the entire `plan.md` — not a summary, not a path, not an excerpt. A summary or path-only pointer does not count as review.
3. Wait. Do not implement. Do not advance the stage. Do not start later stage work-producing side effects.
4. On approval, set `checkpoint_state: granted`, then advance `current_stage` as below.

Any non-approval reply leaves the gate `awaiting`. Denial phrases leave `awaiting`.

## Each stage

If `checkpoint_state` is `awaiting`, this section does not apply — follow Ceremony above. Do not implement. Do not advance the stage.

When `checkpoint_state` is `granted` or `not-required`:

1. Produce the files the recipe lists for this stage, under `docs/specsmd/bolts/{boltId}/`. Use a bundled template when the basename matches. Otherwise write a heading and the body the stage needs.
2. The plan (or the stage's produced artifact) is reviewable. It may name approach. Product specs stay in the work items.
3. Implementation only on implementation stages (empty `produces`, or id `execute` / `implement` / `explore`) after the gate is `granted` or `not-required`.
4. Decision-heavy stages also write one file per decision under `docs/specsmd/decisions/` and a line on `decisions/index.md`.
5. Review findings are severity-gated. Load-bearing findings block the review stage. Advisory findings may be acknowledged, deferred, or contested with reasoning.
6. After artifacts exist: append the stage to `stages_completed`, set `current_stage` to the next id (or keep it if this was the last), set `checkpoint_state` for the next gate (`awaiting` or `not-required`).

Autopilot still writes a plan when the recipe requires `plan.md`. Honor recipe constraints (no source during `no_source_code` stages; a time-boxed bolt that has expired completes into findings instead of continuing).

## Complete

Write the walkthrough first from `references/walkthrough.md` (the `walkthrough-generate` skill is an alternative the user may invoke — do not chain-invoke it). Every completed bolt yields a walkthrough. Required sections: what changed, why, deviations from plan, how to verify. The deviations heading always exists (`none` if nothing diverged). No source listings, patches, or fences — language-tagged, untagged, or `~~~`.

Do not complete if `completion_requires` files are missing, the walkthrough lacks deviations, a fence remains, or a gating DoD checkbox is unchecked. Say what is missing.

On complete: bolt `status: complete`, `current_stage: null`, stamp `completed`. Then cascade named work items to `complete`, then the intent if every item on it is terminal. If matching `system/` docs exist, present them for review before completing; declining still completes and you note that in health later.

## Close

State what the bolt produced. Offer at most three declinable next names. None is required. Do not invoke another skill as a chain.

Now exists:
- `docs/specsmd/bolts/{boltId}/` artifacts this invocation wrote

Declinable next (none required):
- `walkthrough-generate` — if the walkthrough is still missing
- `specsmd-status` — re-orient
- `bolt-start` — start another grouping
