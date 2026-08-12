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

Recipe-agnostic: read the bolt's recorded recipe (`recipe` + `recipe_snapshot`) and run those stages once for the bolt — not once per work item. There is no per-stage skill. Skills never mandate a following skill. The state layer is the only enforcer.

## Resume

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill. Run `scripts/status.cjs` in the `flow-runtime` skill (or read the bolt frontmatter). Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist. Gate state is answerable from that recorded state at any moment.

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
3. Wait. Do not implement. Do not call `update-stage`. Do not start later stage work-producing side effects.
4. On approval, run: `node {SCRIPTS_DIR}/update-checkpoint.cjs {projectRoot} {boltId} {phrase}`
5. Then: `node {SCRIPTS_DIR}/update-stage.cjs {projectRoot} {boltId} {stageId}`

Any non-approval reply leaves the gate `awaiting`. Denial phrases leave `awaiting`.

## Each stage

If `checkpoint_state` is `awaiting`, this section does not apply — follow Ceremony above. Do not implement. Do not call `update-stage`.

When `checkpoint_state` is `granted` or `not-required`:

1. Produce the files the recipe lists for this stage, under `docs/specsmd/bolts/{boltId}/`. Use a bundled template when the basename matches (`references/plan.md`, `references/test-report.md`, `references/review-report.md`, `references/walkthrough.md`, `references/findings.md`, `references/decisions.md`, `references/domain-model.md`, `references/design.md`). Otherwise write a heading and the body the stage needs.
2. The plan (or the stage's produced artifact) is reviewable. It may name approach. Product specs stay in the work items.
3. Implementation only on implementation stages (empty `produces`, or id `execute` / `implement` / `explore`) after the gate is `granted` or `not-required`. Planning and review artifacts are not implementation.
4. Decision-heavy stages (a recipe that produces `decisions.md`) also write one file per decision under `docs/specsmd/decisions/` using `references/decision.md`. Each decision names `consult_when` — the situation a later bolt should retrieve it for — and add a line to `docs/specsmd/decisions/index.md`.
5. Review findings are severity-gated. Load-bearing findings (a gating criterion or constitution rule unmet) block the review stage. Advisory findings may be acknowledged, deferred, or contested with reasoning; record that in `review-report.md`.
6. After artifacts exist: `node {SCRIPTS_DIR}/update-stage.cjs {projectRoot} {boltId} {stageId}`
7. If the script refuses, report the remediation (what to change, where, which standard or evidence it names) and stop. Do not edit frontmatter.

Autopilot still writes a plan when the recipe requires `plan.md`. Honor recipe constraints (no source during `no_source_code` stages; a time-boxed bolt that has expired is completed by the next script write).

## Complete

Write the walkthrough first from `references/walkthrough.md` (the `walkthrough-generate` skill is an alternative the user may invoke — do not chain-invoke it). Every completed bolt yields a walkthrough, even when the recipe has no walkthrough stage. Required sections: what changed, why, deviations from plan, how to verify. The deviations heading always exists (`none` if nothing diverged). No source listings, patches, or fences — language-tagged, untagged, or `~~~`. Then:

```text
node {SCRIPTS_DIR}/complete-bolt.cjs {projectRoot} {boltId}
```

If it refuses, the refusal names missing evidence, a missing deviations heading, a fenced listing, or unmarked gating criteria. Produce those, then retry. `--force` records an override; only use it when the user asks. Completing the bolt completes every tracked item, or none if evidence or gating criteria are missing.

## Close

State what the bolt produced. Offer at most three declinable next names. None is required. Do not invoke another skill as a chain.

Now exists:
- `docs/specsmd/bolts/{boltId}/` artifacts this invocation wrote

Declinable next (none required):
- `walkthrough-generate` — if the walkthrough is still missing
- `specsmd-status` — re-orient
- `bolt-start` — start another grouping
