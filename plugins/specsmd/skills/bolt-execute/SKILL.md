---
name: bolt-execute
description: Use when a bolt's design is accepted and product code should be implemented, tested, or walked through. Test-first on gating criteria; every behavior change carries a covering check. Runs remaining implement stages without confirmation. Refuses if caller-visible contracts are still open.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Bolt execute

Implement, test, review, walkthrough, complete — in this invocation. Test first. No confirmation, validation, or continue prompts. If design is not done, do not implement — tell the user and start `bolt-design`.

A bolt belongs to **exactly one intent**. Path: `docs/specsmd/intents/{intent}/bolts/{id}/`.

You write artifact files **and** frontmatter. Follow `references/transitions.md` in the `flow-runtime` skill.

If the owning brief has `status: draft`, follow `plan-intent` to resolve its
review before executing. Do not use an existing bolt or prior stage approval to
bypass acceptance of the outcome.

## Gate — is design done?

A stage is **design-class** when its id or a produced file is listed under `ceremony` in `references/flow-contract.yaml` in the `flow-runtime` skill. Design is **done** only when all of these are true:

1. A `bolt.md` exists on the named intent.
2. `current_stage` is not design-class.
3. `checkpoint_state` is not `awaiting` on a design-class stage.
4. Every prerequisite design-class artifact this recipe **produced** before `current_stage` has `## Two-implementer` with `Open: none.` Do not require artifacts the recipe does not produce or has not reached; a spike explores before findings.

If there is no bolt, or any check fails:

1. **Tell the user** design is not done. List what failed: missing bolt, current stage, awaiting gate, missing `## Two-implementer`, or each hunt that is still open.
2. Say you are starting `bolt-design` now so those hunts can close. Do not write product code.
3. **Follow the `bolt-design` skill now** (read that skill and continue this turn). Resolve from evidence before asking per `flow-runtime/references/caller-contracts.md`; do not reopen settled choices for another interview.
4. Do not continue this skill's **Run** until the gate above is true.

A missing heading can be repaired from accepted evidence in design; a substantive missing decision remains open. Never manufacture a named freedom to skip this gate.

## Run

Ceremony does not apply here (`ceremony.applies_to: design`). Invoking this skill is the go-ahead.

If `checkpoint_state` is `awaiting` on a non-design stage, set it to `not-required` and continue. Do not wait. Do not emit artifacts for approval. Do not ask to confirm, validate, or continue.

Clarification follows the material choice policy in `references/caller-contracts.md` in the `flow-runtime` skill. **Capture unplanned work** below explains how to preserve the owning artifacts.

Follow `references/implementing.md` in this skill. The recipe snapshot is the only stage catalog.

**Test first, cover always.** A gating criterion for new or changed behavior gets a failing check before product code, seen failing for the right reason. Existing passing evidence may prove unchanged behavior; removal alone requires no new absence test. Every other behavior change gets a covering check in the same stage, named existing coverage, or a recorded decision exempting it (vendored or generated code). Map evidence to changed behavior and boundaries; one check can cover several files.

**Capture unplanned work.** Work no artifact asked for — a course correction, a forgotten requirement, a small change made along the way — goes into the walkthrough's `## Unplanned changes` as it happens. Infer the owning artifact from accepted scope and conventions, record authorized changes, and say what you wrote. Ask only about an unresolved material choice affecting scope, caller behavior, authority or acceptance. A change to a gating criterion or to `brief.md` is routed through `task-decompose` or `plan-intent` with existing authorization preserved, never rewritten here to match what was built.

**Review loop.** When the recipe's review stage carries `loop`, run review rounds per `references/implementing.md`: each round's reviewer is a fresh context following the `bolt-review` skill, findings adjudicate into `review-findings.md` with forward-only dispositions, and the loop closes on executable gates — the named suite plus an external anchor — never on a round returning no findings.

Load context first (semantic `system/` docs, constitution + nearest standards, decisions index, the intent brief and named tasks). Show bolt progress.

Run **every remaining non-design stage** in snapshot order in this invocation. After each stage: append it to `stages_completed`, set `current_stage` to the next id.

Stop early only when:

- a caller-visible hunt reopens — tell the user and follow `bolt-design` now
- a required verification fails — block the affected completion claim, report the failure and continue independent authorized work; do not fix unrelated failures without scope
- a load-bearing review finding — do not complete; say what failed
- required evidence is missing — do not complete; say what is missing

If the next stage is design-class, follow `bolt-design` for that stage within the authorized execution workflow, respecting its required gates, then resume. Do not reopen completed stages. Research unknowns in spike findings are not permission to implement a new product change.

Honor expired `time_box`. Do not invent design.

## Complete

Write the walkthrough first from `references/walkthrough.md`. Every completed bolt yields a walkthrough. Required sections: what changed, why, deviations from plan, **unplanned changes**, **evidence**, how to verify. The deviations and unplanned-changes headings always exist (`none` if nothing diverged). Evidence holds the test record — there is no separate test-report file. No source listings, patches, or fences — language-tagged, untagged, or `~~~`.

Do not complete if `completion_requires` files are missing, the walkthrough lacks deviations, unplanned changes, or evidence, a fence remains, a gating DoD checkbox is unchecked, a changed behavior has no covering check, named cover, or recorded exemption in Evidence, an unplanned change is still `open`, or a load-bearing finding is still `OPEN` in `review-findings.md`. Say what is missing.

On complete: bolt `status: complete`, `current_stage: null`, stamp `completed`. Then cascade named tasks to `complete`: set `status: complete` and check the `tasks.md` box (`- [x]`). Then the intent if every task on it is terminal. If matching `system/` docs exist, name them after complete. Do not wait.

## Close

State what this invocation did. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:

- `docs/specsmd/intents/{intent}/bolts/{id}/` artifacts this invocation wrote

Declinable next (none required):

- `specsmd-status` — re-orient
- `bolt-design` — if a contract hunt reopened
- `plan-intent` — a different outcome
