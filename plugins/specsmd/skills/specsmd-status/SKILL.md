---
name: specsmd-status
description: Use when the user asks where the project stands, what to do next, or which specsmd flow is active. Reads docs/specsmd and suggests the next move without taking it.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: navigator
---

# specsmd Status

Read-only orientation. Never write artifacts. Never invoke another skill. Never repair drift. Never warn, block, or nag if the user ignores every suggestion.

## Process

1. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill.
2. Run: `node {SCRIPTS_DIR}/status.cjs {projectRoot}`
3. Parse the JSON. The file system (via that script) is the source of truth.

## Report

Present three lenses. Empty lenses stay visible.

- **Shaping** — intents and work items not named on any non-draft bolt
- **Building** — active bolts, with stage and checkpoint
- **Shipping** — completed bolts (release is optional; do not nag)

Then health findings from the script, each with severity and remediation. Integrity findings present in the tree appear here.

Then suggested next moves from `data.suggestion`: use that order; do not re-rank. Best first, then the rest, then one line that any skill may be invoked by name. The script's locked order is: awaiting gate → active bolt → empty intent → unbolted items → drafts → empty tree. Integrity findings stay in health — they are not a next skill. Do not take a suggestion. Never suggest `flow-runtime`.

## Constraints

- If the script reports the tree is uninitialized, the best move is `specsmd-init`.
- If status tokens in the tree are not in the contract, report them as health findings. Do not invent a local mapping.
- Do not infer resume position from which files exist. Use `current_stage` and `checkpoint_state`.

## Close

This skill writes nothing and invokes nothing. Present `data.suggestion.options` as declinable choices. Then: any skill may be invoked by name.
