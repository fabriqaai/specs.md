---
name: bolt-execution
description: Use when the user wants to plan, start, resume, or complete a bolt. Groups work items from one intent, runs the recorded recipe under ceremony, and writes the walkthrough.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Bolt execution

One skill for the whole bolt: optional draft, start, resume, stages, walkthrough, complete. Dispatch on what exists and what the user asked. Recipe-agnostic. Never mandate a following skill.

A bolt belongs to **exactly one intent**. Path: `docs/specsmd/intents/{intent}/bolts/{id}/`. Refuse a grouping that names work items from another intent — name both intents and write nothing.

You write artifact files **and** frontmatter. Follow `references/transitions.md` in the `flow-runtime` skill.

## Dispatch

If the user has not named an intent and more than one has pending or active work, ask which intent.

1. User asks only to draft or pre-group → **Draft**
2. No active bolt on this intent and the user wants to start or execute → **Start**
3. An active or interrupted bolt (or the user names one) → **Run**
4. The bolt is ready to finish, or the user asks to complete → **Complete**

## Draft

A draft is a proposal: work items plus a suggested recipe. It is not an execution container. Starting may **adopt**, **modify**, or **ignore** it. Drafts are optional — **Start** can group on the fly.

1. Read pending work items and existing drafts **on this intent**.
2. Propose a grouping and a recipe. Shipped recipes are `default`, `ddd`, `spike`, and `simple`. A project-local recipe in `docs/specsmd/recipes/` is also selectable. If the user does not pick a recipe, recommend from complexity (`recipe.recommend_from_complexity` in `references/flow-contract.yaml` in the `flow-runtime` skill).
3. Write `docs/specsmd/intents/{intent}/bolts/{id}/bolt.md` with `status: draft`. Id format: `bolt-{worktree}-{nnn}` using the next free number for this working copy.

If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

## Start

Creates the execution container. Recipe and ceremony are recorded at creation and do not change.

Calculate three offers from pending (not-on-an-active-bolt) work items **on this intent**:

1. **Single** — one item
2. **Batch** — items that share ceremony, or that the user names
3. **Wide** — all compatible pending items on this intent, dependency order, one bolt

Recommend from autonomy bias (`autonomous` → wide, `controlled` → single, `balanced` → batch if more than two items). If `docs/specsmd/project.md` has `grouping_history` with three matching choices, pre-select that offer. The user may pick any offer or a custom set of items from this intent. Recipe: omit a recipe pick to take the complexity recommendation, or use a shipped or project-local id.

If drafts exist on this intent, present exactly three options first: **adopt** a listed draft, **modify** a listed draft, **ignore** drafts for this start. Dismissing the prompt is **ignore**.

- **Adopt** — copy the draft's work items and recipe; set the draft to `abandoned`
- **Modify** — use the edited work items and recipe; leave the draft unless the user wants it consumed
- **Ignore** — start from the chosen items; drafts stay `draft`

If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

### Ceremony

Values and gates live in `references/flow-contract.yaml` in the `flow-runtime` skill (`ceremony.values` and `ceremony.gates`):

- `autopilot` — no gates
- `confirm` — the recipe's first gateable stage waits
- `validate` — every gateable stage waits

If the user does not pick one, use the most controlled `ceremony_suggested` among the chosen items. The user's explicit choice always wins.

### Write

Create `docs/specsmd/intents/{intent}/bolts/{id}/bolt.md`. Snapshot the recipe YAML into `recipe_snapshot`.

```yaml
id: {id}
intent: {intent}
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

Set each named work item to `status: active`. Set the owning intent to `active` if it was `pending`. Append this grouping choice to `grouping_history` on `project.md`.

Then continue to **Run** in the same invocation unless a gate is awaiting.

## Run

One execution loop. Follow `references/execute.md` in this skill. The recipe snapshot is the only stage catalog.

Read the bolt frontmatter. Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist. Gate state is answerable from that recorded state at any moment.

Load context first (semantic `system/` docs, constitution + nearest standards, decisions index, the intent brief and named work items). Show bolt progress from the recipe snapshot. Then do **one** stage.

### Ceremony while running

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

### Each stage

If `checkpoint_state` is `awaiting`, this section does not apply — follow Ceremony while running above. Do not implement. Do not advance the stage.

When `checkpoint_state` is `granted` or `not-required`:

1. Dispatch the stage from `references/execute.md` in this skill (id, then `produces` basename). Produce listed files under `docs/specsmd/intents/{intent}/bolts/{boltId}/`. Use a bundled template when the basename matches.
2. The plan (or the stage's produced artifact) is reviewable. It may name approach. Product specs stay in the work items.
3. Implementation stages (empty `produces`, or id `execute` / `implement` / `explore`) use **test first**: failing check for a gating criterion, see it fail, smallest change, see it pass. Then the existing suite. Never skip the failing check. Never implement before the check exists.
4. Decision-heavy stages also write one file per decision under `docs/specsmd/decisions/` and a line on `decisions/index.md`.
5. Review findings are severity-gated. Load-bearing findings block the review stage. Advisory findings may be acknowledged, deferred, or contested with reasoning.
6. After artifacts exist: append the stage to `stages_completed`, set `current_stage` to the next id (or keep it if this was the last), set `checkpoint_state` for the next gate (`awaiting` or `not-required`).

Autopilot still writes a plan when the recipe requires `plan.md`. Honor recipe constraints (no source during `no_source_code` stages; a time-boxed bolt that has expired completes into findings instead of continuing).

## Complete

Write the walkthrough first from `references/walkthrough.md`. Every completed bolt yields a walkthrough. Required sections: what changed, why, deviations from plan, **evidence** (what was run and each gating line), how to verify. The deviations heading always exists (`none` if nothing diverged). Evidence holds the test record — there is no separate test-report file. No source listings, patches, or fences — language-tagged, untagged, or `~~~`.

Do not complete if `completion_requires` files are missing, the walkthrough lacks deviations or evidence, a fence remains, or a gating DoD checkbox is unchecked. Say what is missing.

On complete: bolt `status: complete`, `current_stage: null`, stamp `completed`. Then cascade named work items to `complete`, then the intent if every item on it is terminal. If matching `system/` docs exist, present them for review before completing; declining still completes and you note that in health later.

## Close

State what this invocation did (draft, start, stage, complete). Offer at most three declinable next names. None is required. Do not invoke another skill as a chain.

Now exists:
- `docs/specsmd/intents/{intent}/bolts/{id}/` artifacts this invocation wrote

Declinable next (none required):
- `specsmd-status` — re-orient
- `work-item-decompose` — add slices on this intent
- `plan-intent` — capture a different outcome
