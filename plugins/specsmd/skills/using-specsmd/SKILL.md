---
name: using-specsmd
description: Skip standalone questions, read-only reviews and small self-contained edits unless explicitly requested. Route product work in a specsmd project for explicit flow requests, named intent/task/bolt continuation, or substantial delivery needing tracked planning and execution. Preserve the requested phase and existing authorization.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: bootstrap
---

# Using specsmd

If dispatched for one bounded subtask, follow that assignment; do not restart the parent workflow.

specsmd coordinates outcomes, tasks and execution under `docs/specsmd/`. Accepted requirements describe intended behavior; code, types and tests describe current mechanics. Follow the project's authority rules when they differ.

## When the flow applies

Decide from the request and available conversation context before reading the memory bank. Use this flow for an explicit specsmd request, work already assigned to a named intent/task/bolt, or substantial product delivery that needs durable planning, coordinated slices and execution tracking.

Handle standalone questions, explanations, read-only reviews, documentation/skill maintenance and small self-contained edits directly. A focused fix or minor UI change with settled scope does not need an intent just because it changes product behavior. Follow the owning code, relevant project contracts and required checks. Do not scan `docs/specsmd/`, invoke `specsmd-status`, or read this library's references merely to decide whether a simple request needs the flow. The directory's presence does not activate it; neither does an unrelated active bolt. If this skill was loaded for a direct request, return to that work without loading more flow context.

When the request explicitly names the flow or continues its delivery work, inspect only the matching active artifacts and resume the relevant phase. A side question during that work does not restart planning. Honor a design-only, review-only or direct-work request; ask only about an unresolved material choice.

Preserve prior answers and authorization available in the conversation and artifacts. On re-entry or compaction, resume from `current_stage`, `checkpoint_state` and the stored `recipe_snapshot`; do not infer phase from filenames or restart planning. If state is unclear, use `specsmd-status` for read-only orientation.

## Lifecycle

1. `specsmd-init` — if the memory bank is absent and initialization is needed.
2. `plan-intent` — save and review the outcome brief. Stay here while it is `draft`, thin or still being decided; acceptance moves a new brief to `pending`.
3. `task-decompose` — after the outcome is clear, write or extend its `tasks.md` slices.
4. `bolt-design` — group tasks from one intent and produce the recipe's design artifacts. Resolve contracts using `flow-runtime/references/caller-contracts.md`; preserve the selected review gates.
5. `bolt-execute` — after required design is accepted and `Open: none.`, implement, verify and record evidence.
6. Complete the bolt, its named tasks, then the intent only when its tasks are terminal and required evidence exists.

Reviews link saved artifacts with a concise summary, following **Artifact review** in `flow-runtime/references/transitions.md`; approval advances their existing state. An explicit combined workflow may continue across phases within that authorization. A request for one phase stops at its boundary. `flow-runtime` is a reference library, not a next step; `specsmd-status` writes nothing. Skills write artifact frontmatter using `flow-runtime/references/transitions.md`.

## Read path

Read relevant semantic and active task context before historical records. Search indexes first; load only matching `system/` scopes, the constitution and nearest standards, the current brief/tasks, and decisions whose `consult_when` applies. Use owning code and behavior tests for local mechanics. Open completed episodic records only when a current contract points there or the task asks for history.

Initiative guidance has a lifetime. When a milestone ends, retain outstanding obligations in active tasks and promote only enduring contracts into the project's chosen current documentation. Archive the execution narrative; a completed foundation charter is not mandatory context forever. Use existing system registration fields to name applicability and the retirement condition; do not invent a second state system.

## Say where it comes from

Distinguish what you read from what you remember. Name the relevant source when it changes how a claim should be trusted: current code/tests, accepted artifacts, skill definitions, MCP tool definitions or user instructions. Mark inference as inference when it affects the decision. A citation apparatus is not the goal; concise evidence is.

## Precedence

The user's direct instructions and task authorization govern skill use. Follow project authority and scope rules; skills do not silently amend product requirements. Illegal status tokens or completion without evidence remain errors. Ask only about an unresolved material choice, never for permission already given.

## Close

This skill writes nothing. Continue the requested work; do not emit an obligatory menu of next skills.
