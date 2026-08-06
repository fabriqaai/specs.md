---
name: using-specsmd
description: Use at the start of every session in a specsmd project, before any other response or action. Establishes how and when to engage specsmd flow skills for spec-driven development.
license: MIT
metadata:
  version: "1.0.0"
  flow: core
  phase: bootstrap
---

# Using specsmd

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute one specific task, ignore this skill and do your task.
</SUBAGENT-STOP>

specsmd delivers spec-driven development as skills. Specifications are the source of truth; code follows specs, not the other way around.

## The Rule

**Before writing any code, check whether a specsmd flow applies.** If the user asks to build, add, change, or fix functionality in a project that uses specsmd, the work goes through the installed flow — requirements and planning first, implementation second. Do not jump straight to code because the request sounds simple. Simple requests are exactly how unspecified systems grow.

If there is even a small chance a specsmd skill applies to the task, invoke it before responding.

## Orientation

When you are unsure of project state or which skill comes next, invoke the `specsmd-status` skill. It reads the project's artifacts and recommends the next step. Never guess project state from memory — read it.

## Flow entry points

| Installed plugin | Entry skill | Purpose |
|---|---|---|
| specsmd-aidlc | `inception` → `construction` → `operations` | AI-DLC: sequential phases from requirements to deployment |
| specsmd-fire | `fire` | Fast intent-to-run development with autonomy modes |
| specsmd-ideation | `ideation` | Idea generation, evaluation, and concept shaping |
| specsmd-simple | `simple-spec` | Lightweight requirements → design → tasks → execute |

Verb skills (like `intent-create`, `bolt-start`, `run-plan`, `spark`) are user-invoked commands; use them when the user names them or a phase skill hands off to them.

## Precedence

1. User instructions (project instruction files, direct requests) override skills.
2. Skills override your default behavior.
3. Phase discipline overrides implementation urgency: a phase skill's checkpoints and forbidden actions are not negotiable, and being mid-task is not a reason to skip them.

## Red flags — stop and re-check

| Thought | Reality |
|---|---|
| "This is a quick change, no spec needed" | Quick changes still belong to a unit and a story. Check `specsmd-status`. |
| "I remember how this flow works" | Flows evolve. Read the current skill. |
| "The user wants code, not process" | The user installed specsmd. The process is what they asked for. |
| "I'll write the spec after the code works" | Spec-first is the point. Code without a spec is a prototype at best. |
