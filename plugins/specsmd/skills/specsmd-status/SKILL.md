---
name: specsmd-status
description: Use when the user asks where the project stands, what to do next, or which specsmd flow is active — or when you need to route to the right flow skill and the project state is unclear. Reads docs/specsmd and suggests the next move without taking it.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: navigator
---

# specsmd Status

Read-only orientation. Never write artifacts. Never invoke another skill. Never repair drift. Never warn, block, or nag if the user ignores every suggestion.

## Process

Read `docs/specsmd/` directly (project, intents with their work items and bolts, decisions index, system). The files are the source of truth.

## Report

Present **semantic memory first** (`read_path`): `system/`, `standards/`, and the decisions index. Do not open episodic artifacts unless a semantic document refers to them or the user asks for history.

Then present three lenses. Empty lenses stay visible.

- **Shaping** — intents and work items not named on any non-draft bolt
- **Building** — active bolts, with stage and checkpoint
- **Shipping** — completed bolts (history under their intent). There is no release step.

Then health: illegal status tokens, missing `docs/specsmd/`, cascade drift you can see. Do not invent a local mapping for unknown tokens.

Then suggested next moves in this order; do not re-rank: awaiting gate → active bolt → empty intent → unbolted items → drafts → empty tree. Integrity findings stay in health — they are not a next skill. Do not take a suggestion. Never suggest `flow-runtime`.

## Constraints

- If the tree is uninitialized, the best move is `specsmd-init`.
- Do not infer resume position from which files exist. Use `current_stage` and `checkpoint_state`.

## Close

This skill writes nothing and invokes nothing. Present options as declinable choices. Then: any skill may be invoked by name.
