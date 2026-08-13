---
name: using-specsmd
description: Use at the start of every session in a specsmd project, before any other response. Establishes how to engage the unified bolt flow under docs/specsmd/.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: bootstrap
---

# Using specsmd

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute one specific task, ignore this skill and do your task.
</SUBAGENT-STOP>

specsmd is the unified bolt flow. Specifications are the source of truth; code is derived from them.

## The rule

**Before writing product code, check whether this flow applies.** If the user asks to build, add, change, or fix behavior in a project that uses specsmd, the work goes through an intent, work items, and a bolt. Do not jump straight to code because the request sounds small.

If you are unsure of project state, invoke the `specsmd-status` skill. Never guess state from conversation memory.

## Shape of the flow

- **Intent** — problem, outcome, scope, non-goals. No mechanism.
- **Work item** — a vertical slice with a behavioral Definition of Done. Complexity is decision load. `ceremony_suggested` is recorded from the contract matrix.
- **Bolt** — the execution container. Created when work starts. Runs a **recipe** of stages under a **ceremony** (`autopilot` / `confirm` / `validate`). Confirm waits on the first gateable stage; validate waits on every gateable stage.
- Artifacts live in `docs/specsmd/`. State lives in YAML frontmatter. Only the scripts in the `flow-runtime` skill write state.

## Read path

Read **semantic memory first**, then the working (non-terminal) change records. Do not open **episodic** artifacts — completed/abandoned intents, work items, bolts, or individual decision files — unless a semantic document points at them or the user asks for history.

1. `docs/specsmd/system/` — current truth (architecture, integrations, domain facts) plus verification status
2. `docs/specsmd/standards/` — invariants in force
3. `docs/specsmd/decisions/index.md` — in-force decisions only; do not crawl `decisions/`

Active change records (in-flight briefs, work-item DoDs, the live bolt) stay on the working read path after those three. Episodic artifacts are history. Each carries a header of the form `Historical record ({date}). Current truth: {semantic document}.` Follow that one hop up; never chain sideways to a newer episodic file.

## Skills (invoke by name, except this skill and `specsmd-status`)

| Skill | When |
|---|---|
| `specsmd-init` | No `docs/specsmd/` tree yet |
| `intent-create` | New outcome to capture |
| `work-item-decompose` | An intent needs slices |
| `bolt-plan` | Optional draft grouping |
| `bolt-start` | Work is ready to execute |
| `bolt-execute` | A bolt is active or interrupted |
| `walkthrough-generate` | A bolt needs its human walkthrough |
| `release-checklist` | Optional shipping: compile completed bolts |
| `release-verify` | Record confirmation of a released change |

Nothing here is a required next step. Suggestions are options. Close messages of verb skills list artifacts and at most three declinable names. Release is optional; a project that never releases is fine.

## Precedence

1. The user's direct instructions win.
2. Skills override default coding-agent behavior.
3. Scripts refuse illegal state changes. A refused completion is not a prompt to edit frontmatter by hand.

## Red flags

| Thought | Reality |
|---|---|
| "Quick change, no spec" | Still an intent or work item. Check `specsmd-status`. |
| "I'll write the spec after the code works" | The spec leads. Code without a spec is a prototype. |
| "I'll set status: complete myself" | Only `scripts/complete-bolt.cjs` in the `flow-runtime` skill writes that. |

## Close

This skill writes nothing.

Declinable next (none required):
- `specsmd-status` — read the tree
- `intent-create` — capture an outcome
- `specsmd-init` — if the tree does not exist
