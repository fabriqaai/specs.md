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

**Before writing product code, check whether this flow applies.** If the user asks to build, add, change, or fix behavior in a project that uses specsmd, follow the **Lifecycle** below. Do not jump straight to code because the request sounds small.

If you are unsure of project state, invoke the `specsmd-status` skill. Never guess state from conversation memory.

## Lifecycle

One outcome, then slices, then a bolt that designs and then builds.

1. `specsmd-init` — once, if `docs/specsmd/` does not exist.
2. `plan-intent` — write the brief (problem, outcome, what done looks like). Stay here while the outcome is thin or still being decided.
3. `task-decompose` — after the outcome is clear, write that intent's `tasks.md`. Call again to add slices.
4. `bolt-design` — after this intent has tasks, start a bolt. Close caller-visible contracts. Every confirmation lives here.
5. `bolt-execute` — after design is accepted (`Open: none.`), implement, test, and walk through in one go.
6. Complete — bolt, then named tasks, then the intent when every task on it is terminal.

`specsmd-status` orients at any time. It writes nothing.

## Shape of the flow

- **Intent** — problem, outcome, scope, non-goals. No mechanism. File: `brief.md`.
- **Task** — a vertical slice with a behavioral Definition of Done, as a `##` section in the intent's `tasks.md`. Complexity is decision load.
- **Bolt** — the execution container, scoped to one intent. `bolt-design` writes plan/design and closes caller-visible contracts. `bolt-execute` implements only after those hunts are closed.

Artifacts live in `docs/specsmd/`. State lives in YAML frontmatter. **Skills write that frontmatter** following `transitions.md` in the `flow-runtime` skill.

## Read path

Read **semantic memory first**, then working (non-terminal) change records. Active change records stay on the working read path. Do not open **episodic** artifacts unless a semantic document points at them or the user asks for history.

1. `docs/specsmd/system/`
2. `docs/specsmd/standards/`
3. `docs/specsmd/decisions/index.md` — discovery only. Decision files live on the bolt that made them (`docs/specsmd/intents/{intent}/bolts/{bolt}/decisions/`). Open a linked file only when `consult_when` matches or the user asks for history.

## Skills (invoke by name, except this skill and `specsmd-status`)

| Skill | When |
|---|---|
| `specsmd-init` | No `docs/specsmd/` tree yet |
| `plan-intent` | Capture or keep shaping an outcome brief |
| `task-decompose` | After the brief's outcome is captured; write or extend that intent's `tasks.md` |
| `bolt-design` | This intent has `tasks.md` slices; start or continue design |
| `bolt-execute` | Design is accepted; implement |

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
