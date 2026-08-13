---
name: using-specsmd
description: Use at the start of every session in a specsmd project, before any other response or action. Establishes how and when to engage the specsmd flow under docs/specsmd/.
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

specsmd is the **specsmd flow**. Specifications under `docs/specsmd/` are the memory bank and the source of truth; code is derived from them.

## The rule

**Before writing product code, check whether this flow applies.** If the user asks to build, add, change, or fix behavior in a project that uses specsmd, the work goes through an intent, work items, and a bolt. Do not jump straight to code because the request sounds small.

If you are unsure of project state, invoke the `specsmd-status` skill. Never guess state from conversation memory.

## Shape of the flow

- **Intent** — problem, outcome, scope, non-goals. No mechanism.
- **Work item** — a vertical slice with a behavioral Definition of Done, as a section in the intent's `tasks.md`. Complexity is decision load.
- **Bolt** — the execution container, scoped to one intent, living under that intent's folder. Created when work starts (dynamic grouping: single, batch, or wide of that intent). Optional drafts. Runs a **recipe** of stages under a **ceremony** (`autopilot` / `confirm` / `validate`). One skill: `bolt-execution`.

Artifacts live in `docs/specsmd/`. State lives in YAML frontmatter. **Skills write that frontmatter** following `transitions.md` in the `flow-runtime` skill.

## Read path

Read **semantic memory first**, then working (non-terminal) change records. Active change records stay on the working read path. Do not open **episodic** artifacts unless a semantic document points at them or the user asks for history.

1. `docs/specsmd/system/`
2. `docs/specsmd/standards/`
3. `docs/specsmd/decisions/index.md`

## Skills (invoke by name, except this skill and `specsmd-status`)

| Skill | When |
|---|---|
| `specsmd-init` | No `docs/specsmd/` tree yet |
| `plan-intent` | New outcome to capture |
| `work-item-decompose` | An intent needs slices |
| `bolt-execution` | Draft, start, resume, or complete a bolt |

Nothing here is a required next step.

## Precedence

1. The user's direct instructions win.
2. Skills override default coding-agent behavior.
3. Illegal state (unknown status token, complete without evidence) is refused in the skill — say what is missing.

## Close

This skill writes nothing.

Declinable next (none required):
- `specsmd-status` — read the tree
- `plan-intent` — capture an outcome
- `specsmd-init` — if the tree does not exist
