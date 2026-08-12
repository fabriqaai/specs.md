---
name: specsmd-init
description: Use when a project has no docs/specsmd tree yet, or the user wants to initialize the unified bolt flow. Asks autonomy bias, detects workspace shape, and records standards.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Initialize specsmd

One required question: the project's **autonomy bias**.

| Bias | Meaning |
|---|---|
| `autonomous` | Fewer gates. Trust the agent more. |
| `balanced` | Default. Medium work confirms; high work validates. |
| `controlled` | More gates. Human reviews each gateable stage at the high end. |

Workspace shape (greenfield vs existing code, single project vs monorepo) is detected, not asked.

## Process

1. If the user has not stated a bias, ask once and accept `balanced` on empty input.
2. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill.
3. Run: `node {SCRIPTS_DIR}/init-project.cjs {projectRoot} --autonomy-bias {bias}`
4. Report the artifact root, the recorded bias, and the detected workspace shape.
5. If `data.standards.pending_confirmation` is non-empty, present those inferred standards (id, scope, invariant, inferred_from) and wait for accept / edit / skip. That confirmation is not a second required question — initialization already completed after autonomy bias.
   - Accept the inferred set: `node {SCRIPTS_DIR}/record-standards.cjs {projectRoot} --confirm`
   - Edit: `node {SCRIPTS_DIR}/record-standards.cjs {projectRoot} --standards-json '<json>'` where `<json>` is an array of `{id, scope, invariant, enforcement_tier}` objects, or an object with `standards`, `proposals`, or `pending_confirmation` (the init payload round-trips). Any other JSON shape is rejected.
   - Skip: leave them unrecorded.
6. Do not record inferred standards until the user confirms. `--standards-json` without a valid array is not confirmation.

Do not write files yourself. The scripts create `docs/specsmd/` and record standards.

## Close

State what now exists. Offer — without requiring — `intent-create`.
