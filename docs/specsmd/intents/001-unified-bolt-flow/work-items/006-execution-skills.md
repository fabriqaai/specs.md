---
id: 006-execution-skills
title: Executing work — bolts run recipes under the ceremony dial
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [002-recipe-catalog, 003-state-scripts]
created: 2026-08-09
sufficiency: dogfood-cleared
sufficiency_date: 2026-08-13
---

# Executing work — bolts run recipes under the ceremony dial

Execution is where agents do the work. A bolt is created when the user (or the flow's recommendation, accepted by the user) decides work starts; it runs its recipe's stages under exactly as much ceremony as the work's complexity and the project's autonomy bias call for.

## Behavior

- Starting a bolt offers scope: a single work item, a batch, or an existing draft. The chosen work items, recipe, and ceremony level are recorded in the bolt's state at creation.
- Stages come from the bolt's recipe — execution is recipe-agnostic. A stage's required artifacts must exist before the stage is recorded complete.
- The ceremony dial governs gates: at the autonomous end stages flow without stopping; at the controlled end each gateable stage awaits approval. Awaiting, granted, and not-required gate states are readable from the bolt's state at any time.
- The plan a bolt produces is itself a spec: at confirm and validate ceremony the plan is presented for genuine review before implementation *(an unread approved plan encodes instructions nobody chose — the flow surfaces the plan, not a summary of it)*.
- Guardrail failures during execution (a standard violated, required evidence missing) reach the agent as remediation instructions — what to change, where, and which standard says so.
- Decision-heavy recipes record decisions as retrievable entries: each decision names when a future reader should consult it.
- A completed bolt yields a human-facing walkthrough: what changed, why, deviations from plan, and how to verify — containing no code.
- Review feedback (from humans or reviewing agents) is severity-gated: load-bearing findings block; advisory findings may be acknowledged, deferred, or contested with reasoning.

## Out of scope

Deployment and post-release operation (the Operations question is open at the intent level). Parallel execution coordination beyond what identifier safety and per-bolt state already give.

## Decided defaults (dogfood slice)

Execution skills are exactly `bolt-start`, `bolt-execute`, `walkthrough-generate`. By-name only. Recipe-agnostic. Skills never name a required next skill.

- Ceremony values: `autopilot` (no gates), `confirm` (first gateable stage), `validate` (every gateable stage). Default = most controlled `ceremony_suggested` among chosen items, unless the user sets one.
- Confirm/validate: emit the full plan text in the approval turn. Autopilot still writes `plan.md` when the recipe requires it.
- Completing the bolt completes every tracked item, or none if evidence/gating ACs are missing.
- Every completed bolt yields a walkthrough (even without a walkthrough stage). "No code" = no language-tagged fences, source listings, or patches. Deviations section always exists.
- Gate states: `awaiting | granted | not-required`. Denial leaves `awaiting`.

## Definition of Done

- [ ] (gating) A bolt started from a batch of two work items runs its recipe's stages once for the bolt, tracks both items, and completes both on bolt completion.
- [ ] (gating) The same recipe run at autonomous ceremony reaches completion with zero approval stops; at controlled ceremony every gateable stage stops and awaits.
- [ ] (gating) A bolt's gate state is answerable from its recorded state at any moment *(no reconstruction from conversation history)*.
- [ ] (gating) Completion without the recipe's required test evidence is refused by the state layer *(the skill cannot talk its way past it)*.
- [ ] (gating) The walkthrough of a completed bolt contains no code and includes deviations from plan.
- [ ] (advisory) A decision entry's "consult when" hint retrieves the decision in a later bolt facing that situation.
