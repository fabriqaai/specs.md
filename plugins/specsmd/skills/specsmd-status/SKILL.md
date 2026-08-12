---
name: specsmd-status
description: Use when the user asks where the project stands, what to do next, or which specsmd work is in flight. Reads docs/specsmd and suggests the next move without taking it.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: navigator
---

# specsmd Status

Read-only orientation. Never write artifacts. Never invoke another skill. Never repair drift.

## Process

1. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill.
2. Run: `node {SCRIPTS_DIR}/status.cjs {projectRoot}`
3. Parse the JSON. The file system (via that script) is the source of truth.

## Report

Present three lenses. Empty lenses stay visible.

- **Shaping** — intents and work items not named on any non-draft bolt
- **Building** — active bolts, with stage and checkpoint
- **Shipping** — completed bolts (release is optional; do not nag)

Then health findings from the script, each with severity and remediation.

Then suggested next moves from `data.suggestion`: best first, then the rest, then one line that any skill may be invoked by name. Do not take a suggestion. Do not warn if the user ignores them.

## Constraints

- If the script reports the tree is uninitialized, the best move is `specsmd-init`.
- If status tokens in the tree are not in the contract, report them as health findings. Do not invent a local mapping.
- Do not infer resume position from which files exist. Use `current_stage` and `checkpoint_state`.
