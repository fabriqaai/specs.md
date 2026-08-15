---
name: bolt-design
description: Use when starting a bolt or writing its plan, domain model, design, or decisions. Groups tasks from one intent and closes caller-visible contracts before any product code.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Bolt design

Draft, start, and the **no-code** recipe stages. Close caller-visible contracts. Do not write product code. When the next stage is implement / execute / explore, stop and offer `bolt-execute`.

A bolt belongs to **exactly one intent**. Path: `docs/specsmd/intents/{intent}/bolts/{id}/`. Refuse a grouping that names tasks from another intent — name both intents and write nothing.

You write artifact files **and** frontmatter. Follow `references/transitions.md` in the `flow-runtime` skill.

## Dispatch

If the user has not named an intent and more than one has pending or active work, ask which intent.

1. User asks only to draft or pre-group → **Draft**
2. No active bolt on this intent and the user wants to start or design → **Start**. If the brief still has thin headings, offer `plan-intent`. If the outcome is captured and this intent has no `tasks.md` slices, write nothing and offer `task-decompose` so the bolt has slices to group.
3. An active bolt whose `current_stage` is a design stage → **Run**
4. `current_stage` is implement / execute / explore / test / review / walkthrough → do not run those here. Offer `bolt-execute`.

## Draft

A draft is a proposal: tasks plus a suggested recipe. It is not an execution container. Starting may **adopt**, **modify**, or **ignore** it. Drafts are optional — **Start** can group on the fly.

1. Read pending tasks and existing drafts **on this intent**.
2. Propose a grouping and a recipe. Shipped recipes are `default`, `ddd`, `spike`, and `simple`. A project-local recipe in `docs/specsmd/recipes/` is also selectable. If the user does not pick a recipe, recommend from complexity (`recipe.recommend_from_complexity` in `references/flow-contract.yaml` in the `flow-runtime` skill).
3. Write `docs/specsmd/intents/{intent}/bolts/{id}/bolt.md` with `status: draft`. Id format: `bolt-{worktree}-{nnn}` using the next free number for this working copy.

If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

## Start

Creates the execution container. Recipe and ceremony are recorded at creation and do not change.

Calculate three offers from pending (not-on-an-active-bolt) tasks **on this intent**:

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

Values and gates live in `references/flow-contract.yaml` in the `flow-runtime` skill (`ceremony.values`, `ceremony.gates`, `ceremony.applies_to`). Gates apply only to **design-class** stages.

- `autopilot` — no gates
- `confirm` — the first gateable design stage waits
- `validate` — every gateable design stage waits

Implement stages never wait. Invoking `bolt-execute` is the go-ahead.

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
checkpoint_state: awaiting|not-required
work_items: [{id}, {id}]
created: {ISO-8601}
```

Set each named task to `status: active`. Set the owning intent to `active` if it was `pending`. Append this grouping choice to `grouping_history` on `project.md`.

Then continue to **Run** in the same invocation unless a gate is awaiting.

## Run

Follow `references/designing.md` in this skill. The recipe snapshot is the only stage catalog.

Read the bolt frontmatter. Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist.

Load context first (semantic `system/` docs, constitution + nearest standards, `docs/specsmd/decisions/index.md`, the intent brief and named tasks). Show bolt progress. Then do **one** design stage.

If `current_stage` is an implementation stage (empty `produces`, or id `execute` / `implement` / `explore` / `test` / `review` / `walkthrough`), stop. Offer `bolt-execute`.

### Ceremony while running

Gates are `ceremony.gates` in `references/flow-contract.yaml` in the `flow-runtime` skill:

| Ceremony | Gates |
|---|---|
| `autopilot` | None. Write required artifacts and advance. |
| `confirm` | The first gateable design stage waits. |
| `validate` | Every gateable design stage waits. |

When `checkpoint_state` is `awaiting`:

1. Write the stage's required artifacts if they are not already written.
2. Emit the **full current text** of every artifact this stage produces in the same turn as the approval prompt. If the stage produces `plan.md`, emit the entire `plan.md` — not a summary, not a path, not an excerpt. A summary or path-only pointer does not count as review.
3. Wait. Do not implement. Do not advance the stage. Do not start later stage work-producing side effects.
4. On approval, set `checkpoint_state: granted`, then advance `current_stage` as below.

Any non-approval reply leaves the gate `awaiting`. Denial phrases leave `awaiting`.

### Each design stage

If `checkpoint_state` is `awaiting`, this section does not apply — follow Ceremony while running above. Do not implement. Do not advance the stage.

When `checkpoint_state` is `granted` or `not-required`:

1. Dispatch from `references/designing.md` in this skill. Produce listed files under `docs/specsmd/intents/{intent}/bolts/{boltId}/`. Use a bundled template when the basename matches.
2. The artifact is reviewable. Product specs stay in the brief and `tasks.md`.
3. **Close hunts before advancing.** Follow `references/caller-contracts.md` in the `flow-runtime` skill — same rhythm as intent planning. One open hunt per turn. Offer A / B / C, explain what a caller observes under each, **recommend first**, wait. Do not batch. Do not write `Open: none.` in the same turn you first named the hunt.
4. After each pick, check the intent brief and named tasks. If the pick contradicts them or the brief is silent and should inherit the choice, ask permission (change the pick / update the brief or task / name a freedom). Edit `brief.md` or `tasks.md` **only after an explicit yes**.
5. Each closed hunt that is a real decision becomes a file at `docs/specsmd/intents/{intent}/bolts/{boltId}/decisions/{id}.md` (template `references/decision.md` in this skill). Append a row to `docs/specsmd/decisions/index.md`: title, one-line summary, consult-when, path. Also list it on this bolt's `decisions.md`.
6. Write `## Two-implementer` with `Open: none.` only when every hunt is a chosen reading or a named freedom. Then append the stage to `stages_completed` and set the next `current_stage`.

Autopilot still writes a plan when the recipe requires `plan.md`. Honor `no_source_code` and expired `time_box`.

Do not write product source. Do not start `bolt-execute` as a chain.

## Close

State the bolt id, stage, and whether Two-implementer is `Open: none`. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{intent}/bolts/{id}/` design artifacts this invocation wrote

Declinable next (none required):
- `bolt-execute` — implement; it runs the rest without confirmation
- `specsmd-status` — re-orient
- `task-decompose` — add `tasks.md` slices
