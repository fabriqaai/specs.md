---
name: specsmd-init
description: Use when a project has no docs/specsmd tree yet, or the user wants to initialize the specsmd flow. Asks autonomy bias, detects workspace shape, and records standards.
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

Workspace shape (greenfield vs existing code, single project vs monorepo) is detected, not asked. Empty input = `balanced`.

## Write

Create `docs/specsmd/` as the memory bank (not `memory-bank/`, not `.specs-fire/`):

```text
docs/specsmd/
  project.md          # frontmatter: status, autonomy_bias, grouping_history, created
  README.md
  intents/
  bolts/
  recipes/            # copy default.yaml, ddd.yaml, spike.yaml, simple.yaml from flow-runtime
  standards/          # copy constitution + shipped templates from flow-runtime
  decisions/index.md
  system/
```

`project.md` status is `active`. Copy recipe and standard files from the `flow-runtime` skill's `references/`.

In an existing codebase, propose inferred standards (id, scope, invariant). Confirm before writing them. That confirmation is not a second required question.

Do not require a script. Write the files.

## Close

State what now exists. Offer — without requiring — `intent-create`.

Declinable next (none required):
- `intent-create` — capture an outcome
- `specsmd-status` — read the tree
