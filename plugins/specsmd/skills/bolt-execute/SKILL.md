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

Recipe-agnostic: read the bolt's recorded recipe and run those stages. There is no per-stage skill. Skills never name a required next skill. The state layer is the only enforcer.

## Resume

Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill. Run `scripts/status.cjs` in the `flow-runtime` skill (or read the bolt frontmatter). Resume from `current_stage` and `checkpoint_state`. Do not infer the stage from which files exist.

## Ceremony

| Ceremony | Gates |
|---|---|
| `autopilot` | None. Write required artifacts and advance. |
| `confirm` | The recipe's first gateable stage waits. |
| `validate` | Every gateable stage waits. |

When `checkpoint_state` is `awaiting`:

1. Write the stage's required artifact if it is not already written.
2. At confirm/validate on the plan-producing stage, emit the **full current text** of `plan.md` in the same turn as the approval prompt. A summary or path-only pointer does not count.
3. Wait. Do not start later stage work-producing side effects.
4. On approval, run: `node {SCRIPTS_DIR}/update-checkpoint.cjs {projectRoot} {boltId} {phrase}`
5. Then: `node {SCRIPTS_DIR}/update-stage.cjs {projectRoot} {boltId} {stageId}`

Any non-approval reply leaves the gate awaiting.

## Each stage

1. Produce the files the recipe lists for this stage, under `docs/specsmd/bolts/{boltId}/`. Use `references/plan.md`, `references/test-report.md`, and `references/review-report.md` as shapes.
2. The plan is a reviewable artifact, not a spec: it may name approach. Product specs stay in the work items.
3. Implementation follows the work items' Definitions of Done. No mechanism in those specs.
4. After artifacts exist: `node {SCRIPTS_DIR}/update-stage.cjs {projectRoot} {boltId} {stageId}`
5. If the script refuses, report the remediation and stop. Do not edit frontmatter.

Autopilot still writes a plan when the recipe requires `plan.md`.

## Complete

Write the walkthrough first (invoke the `walkthrough-generate` skill, or write `walkthrough.md` from `references/walkthrough.md` in this skill). Then:

```text
node {SCRIPTS_DIR}/complete-bolt.cjs {projectRoot} {boltId}
```

If it refuses, the refusal names missing evidence or unmarked gating criteria. Produce those, then retry. `--force` records an override; only use it when the user asks.

## Close

State what the bolt produced. Offer — without requiring — `specsmd-status`. Do not invoke another skill as a chain.
