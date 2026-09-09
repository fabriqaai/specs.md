---
name: specsmd-status
description: Use for delivery status requests about where the project stands, what to do next, or which specsmd flow is active. Orient when project state is unclear only if the flow is already relevant. Skip ordinary questions, debugging status and small direct edits. Reads docs/specsmd without taking the next step.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: navigator
---

# specsmd Status

Read-only orientation. Never write artifacts. Never invoke another skill. Never repair drift. Never warn, block, or nag if the user ignores every suggestion.

Use only for delivery-state orientation. Answer a simple question or the progress
of the current command directly from available evidence; do not inspect the
memory bank just because the project contains one.

## Process

Read current project and relevant intent/task/bolt metadata directly. Use indexes to locate matching system scopes and decisions; do not open every historical artifact. The files establish workflow state; completion metadata alone does not prove a live surface.

## Report

Present **semantic memory first** (`read_path`): `system/`, `standards/`, and the decisions index. Do not open episodic artifacts unless a semantic document refers to them or the user asks for history.

For a general status request, present the relevant lenses below; omit empty ones. For a focused status request, answer that scope directly.

- **Shaping** — intents and `tasks.md` slices not named on any non-draft bolt
- **Building** — active bolts, with stage and checkpoint
- **Shipping** — completed bolts (history under their intent). There is no release step.

Then health: illegal status tokens, missing `docs/specsmd/`, cascade drift you can see. Do not invent a local mapping for unknown tokens.

Then suggested next moves in this order; do not re-rank: awaiting gate → active bolt → unfinished brief → captured outcome without tasks → unbolted tasks → drafts → empty tree. Integrity findings stay in health — they are not a next skill. Do not take a suggestion. Never suggest `flow-runtime`.

An unaccepted draft brief is an awaiting outcome review and routes to `plan-intent`, even with complete headings or existing tasks. Show its file link and state; do not suggest starting dependent work. Map other situations: unfinished brief (thin headings or the outcome still being decided) → `plan-intent`. Accepted outcome and this intent has no `tasks.md` → `task-decompose`. Unbolted tasks → `bolt-design`.

## Constraints

- If the tree is uninitialized, the best move is `specsmd-init`.
- Do not infer resume position from which files exist. Use `current_stage` and `checkpoint_state`.

## Close

This skill writes nothing and invokes nothing. Present options as declinable choices. Then: any skill may be invoked by name.
