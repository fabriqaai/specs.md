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

Draft, start, and the **no-code** recipe stages. Close caller-visible contracts. Do not write product code. When the next stage is implement / execute / explore, a design-only request stops. If the user already authorized the combined workflow, follow `bolt-execute` after required gates close.

A bolt belongs to **exactly one intent**. Path: `docs/specsmd/intents/{intent}/bolts/{id}/`. Refuse a grouping that names tasks from another intent — name both intents and write nothing.

You write artifact files **and** frontmatter. Follow `references/transitions.md` in the `flow-runtime` skill.

If the owning brief has `status: draft`, route its review to `plan-intent` before
starting or resuming delivery. Existing tasks or a filled-in brief do not grant
acceptance. Do not activate a bolt under an unaccepted outcome.

## Dispatch

Resolve the intent from the request, named tasks and active context. Ask which intent only if more than one remains plausible after inspection.

1. User asks only to draft or pre-group → **Draft**
2. No active bolt on this intent and the user wants to start or design → **Start**. If the brief is thin, route to `plan-intent` within the authorized scope. If an accepted outcome has no `tasks.md` slices and the requested workflow includes decomposition, follow `task-decompose` in the same turn, then return here after its gates pass. When decomposition falls outside the requested phase, offer it and stop at that boundary.
3. An active bolt whose `current_stage` is a design stage → **Run**
4. `current_stage` is implement / execute / explore / test / review / walkthrough → route to `bolt-execute` when execution is already authorized; otherwise offer it. This design skill does not execute source changes.

## Draft

A draft is a proposal: tasks plus a suggested recipe. It is not an execution container. Starting may **adopt**, **modify**, or **ignore** it. Drafts are optional — **Start** can group on the fly.

1. Read pending tasks and existing drafts **on this intent**.
2. Propose a grouping and a recipe. Shipped recipes are `default`, `ddd`, `spike`, `simple`, and `autonomous` (adds a gate-closed review loop for large unattended runs). A project-local recipe in `docs/specsmd/recipes/` is also selectable. If the user does not pick a recipe, recommend from complexity (`recipe.recommend_from_complexity` in `references/flow-contract.yaml` in the `flow-runtime` skill).
3. Write `docs/specsmd/intents/{intent}/bolts/{id}/bolt.md` with `status: draft`. Id format: `bolt-{worktree}-{nnn}` using the next free number for this working copy.

If the chosen items' dependencies cycle, name the cycle. Write nothing else from that invocation.

## Start

Creates the execution container. Recipe and ceremony are recorded at creation and do not change.

Use the already authorized task set when specified. Otherwise select a coherent grouping from pending (not-on-an-active-bolt) tasks **on this intent**, using these available shapes:

1. **Single** — one item
2. **Batch** — items that share ceremony, or that the user names
3. **Wide** — all compatible pending items on this intent, dependency order, one bolt

Recommend from autonomy bias (`autonomous` → wide, `controlled` → single, `balanced` → batch if more than two items). If `docs/specsmd/project.md` has `grouping_history` with three matching choices, pre-select that offer. The user may pick any offer or a custom set of items from this intent. Recipe: omit a recipe pick to take the complexity recommendation, or use a shipped or project-local id.

For existing drafts the choices are **adopt**, **modify**, or **ignore**. Follow an explicit choice without re-asking. If no draft was requested and the authorized task set is clear, ignore drafts. Ask only if adopting or changing one would materially change the requested scope. Dismissing the prompt is **ignore**.

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

Set each named task to `status: active`. Set the owning intent to `active` if it was `pending`. Append this grouping choice to `grouping_history` on `project.md`, retaining only the last three choices as specified in `flow-runtime/references/transitions.md`. Each bolt retains its own full work-item grouping.

Then continue to **Run** in the same invocation to prepare the current stage and present any required review. An awaiting checkpoint does not prevent writing its review artifacts.

## Run

Follow `references/designing.md` in this skill. The recipe snapshot is the only stage catalog.

Read the bolt frontmatter. Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist.

Load context first (semantic `system/` docs, constitution + nearest standards, `docs/specsmd/decisions/index.md`, the intent brief and named tasks). Show bolt progress. Continue eligible design stages in snapshot order until a required gate, a material blocker, a time box or the requested phase boundary.

If `current_stage` is an implementation stage (empty `produces`, or id `execute` / `implement` / `explore` / `test` / `review` / `walkthrough`), respect the requested phase boundary. A design-only request stops; an already authorized combined workflow continues through `bolt-execute`.

### Ceremony while running

Gates are `ceremony.gates` in `references/flow-contract.yaml` in the `flow-runtime` skill:

| Ceremony | Gates |
|---|---|
| `autopilot` | None. Write required artifacts and advance. |
| `confirm` | The first gateable design stage waits. |
| `validate` | Every gateable design stage waits. |

Use **Artifact review** in `references/transitions.md` in the `flow-runtime` skill. Complete and self-review the current stage's saved artifacts before
presenting its gate. The prompt links those files with a concise summary.

When `checkpoint_state` is `awaiting`, requested revisions edit the same files.
Do not advance the stage, implement, or start later stage side effects. Approval
applies to the presented saved revision; substantive changes require review of
the updated revision. On acceptance, set `checkpoint_state: granted` and advance
without rewriting the approved artifacts. A non-approval reply leaves the gate
`awaiting`.

### Each design stage

For a new or revised design stage:

1. Dispatch from `references/designing.md` in this skill. Produce listed files under `docs/specsmd/intents/{intent}/bolts/{boltId}/`. Use a bundled template when the basename matches.
2. **Resolve from evidence before asking.** Follow `references/caller-contracts.md` in the `flow-runtime` skill. Inherit settled contracts, inspect current mechanics, and ask only about an unresolved material choice. A missing required answer blocks dependent work.
3. Record authorized choices in the owning artifacts. If a choice changes scope or acceptance criteria or contradicts an accepted requirement, resolve the concrete difference before changing the contract. Never weaken a gate to fit implementation.
4. Each closed hunt that is a real decision becomes a file under this bolt's `decisions/`, with its discovery row in `docs/specsmd/decisions/index.md` and a reference in this bolt's `decisions.md`.
5. Write `## Two-implementer` with `Open: none.` only when every relevant hunt is resolved or a legitimate named freedom. Self-review the saved artifacts before requesting approval.
6. If this stage has a required ungranted gate, set `checkpoint_state: awaiting` and follow Ceremony while running. Keep `current_stage` here until the saved revision is accepted. Otherwise use `not-required` and advance directly.

After the stage's contracts close and its gate is `granted` or `not-required`,
append the stage to `stages_completed` and set the next `current_stage`. Use the
existing saved artifacts on resume; approval advances state without a second
authoring pass. Determine the next stage's checkpoint from the ceremony; a grant
for this stage does not grant a later `validate` gate.

Autopilot still writes a plan when the recipe requires `plan.md`. Honor `no_source_code` and expired `time_box`.

Do not write product source within this skill. For a design-only request, stop at that boundary. An already authorized combined workflow may proceed through `bolt-execute` after every required design gate is satisfied.

## Close

State the bolt id, stage, and whether Two-implementer is `Open: none`. Continue any next phase already authorized in the requested workflow after its gates pass. At the end of that scope, offer at most three optional next names without invoking them.

Now exists:

- `docs/specsmd/intents/{intent}/bolts/{id}/` design artifacts this invocation wrote

Declinable next (none required):

- `bolt-execute` — implement; it runs the rest without confirmation
- `specsmd-status` — re-orient
- `task-decompose` — add `tasks.md` slices
