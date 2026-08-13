---
name: bolt-execute
description: Use when a bolt's design is accepted and product code should be implemented, tested, or walked through. Test-first. Refuses if caller-visible contracts are still open.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Bolt execute

Implement, test, review, walkthrough, complete. Test first. If design is not done, do not implement — tell the user and start `bolt-design`.

A bolt belongs to **exactly one intent**. Path: `docs/specsmd/intents/{intent}/bolts/{id}/`.

You write artifact files **and** frontmatter. Follow `references/transitions.md` in the `flow-runtime` skill.

## Gate — is design done?

Design is **done** only when all of these are true:

1. A `bolt.md` exists on the named intent.
2. `current_stage` is an implement stage (`execute` / `implement` / `explore` / `test` / `review` / `walkthrough`), not a design stage.
3. `checkpoint_state` is not `awaiting` on a design artifact.
4. The latest design-class artifact (`plan.md`, `domain-model.md`, `design.md`, or `decisions.md`) has `## Two-implementer` with `Open: none.`

If there is no bolt, or any check fails:

1. **Tell the user** design is not done. List what failed: missing bolt, current stage, awaiting gate, missing `## Two-implementer`, or each hunt that is still open.
2. Say you are starting `bolt-design` now so those hunts can close. Do not write product code.
3. **Follow the `bolt-design` skill now** (read that skill and continue this turn). One hunt per turn, options with explanations, recommendation first.
4. Do not continue this skill's **Run** until the gate above is true.

Leftover hunts become named freedoms only on the design artifact, with the user's pick — not by skipping this gate.

## Run

Follow `references/implementing.md` in this skill. The recipe snapshot is the only stage catalog.

Load context first (semantic `system/` docs, constitution + nearest standards, decisions index, the intent brief and named tasks). Show bolt progress. Then do **one** stage.

### Ceremony while running

Gates are `ceremony.gates` in `references/flow-contract.yaml` in the `flow-runtime` skill:

| Ceremony | Gates |
|---|---|
| `autopilot` | None. Write required artifacts and advance. |
| `confirm` | The recipe's first gateable stage waits. |
| `validate` | Every gateable stage waits. |

When `checkpoint_state` is `awaiting`:

1. Write the stage's required artifacts if they are not already written.
2. Emit the **full current text** of every artifact this stage produces in the same turn as the approval prompt. Not a summary.
3. Wait. Do not implement further. Do not advance the stage.
4. On approval, set `checkpoint_state: granted`, then advance.

Any non-approval reply leaves the gate `awaiting`. Denial phrases leave `awaiting`.

### Each implement stage

If `checkpoint_state` is `awaiting`, this section does not apply. Do not implement. Do not advance the stage.

When `checkpoint_state` is `granted` or `not-required`:

1. Dispatch from `references/implementing.md` in this skill. Produce listed files under `docs/specsmd/intents/{intent}/bolts/{boltId}/`.
2. Implementation stages (empty `produces`, or id `execute` / `implement` / `explore`) use **test first**: failing check for a gating criterion, see it fail, smallest change, see it pass. Then the existing suite. Never skip the failing check. Never implement before the check exists.
3. Review findings are severity-gated. Load-bearing findings block. Advisory may be acknowledged, deferred, or contested.
4. After artifacts exist: append the stage to `stages_completed`, set `current_stage` to the next id, set `checkpoint_state` for the next gate.

Honor expired `time_box`. Do not invent design. If a caller-visible choice appears that design did not close, stop, tell the user the hunt reopened, and follow `bolt-design` now.

## Complete

Write the walkthrough first from `references/walkthrough.md`. Every completed bolt yields a walkthrough. Required sections: what changed, why, deviations from plan, **evidence**, how to verify. The deviations heading always exists (`none` if nothing diverged). Evidence holds the test record — there is no separate test-report file. No source listings, patches, or fences — language-tagged, untagged, or `~~~`.

Do not complete if `completion_requires` files are missing, the walkthrough lacks deviations or evidence, a fence remains, or a gating DoD checkbox is unchecked. Say what is missing.

On complete: bolt `status: complete`, `current_stage: null`, stamp `completed`. Then cascade named tasks to `complete`: set `status: complete` and check the `tasks.md` box (`- [x]`). Then the intent if every task on it is terminal. If matching `system/` docs exist, present them for review; declining still completes.

## Close

State what this invocation did. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{intent}/bolts/{id}/` artifacts this invocation wrote

Declinable next (none required):
- `specsmd-status` — re-orient
- `bolt-design` — if a contract hunt reopened
- `plan-intent` — a different outcome
