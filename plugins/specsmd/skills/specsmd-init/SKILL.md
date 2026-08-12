---
name: specsmd-init
description: Use when a project has no docs/specsmd tree yet, or the user wants to initialize the unified bolt flow. Asks autonomy bias and creates the artifact root.
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
4. Report the artifact root and the recorded bias.

Do not write files yourself. The script creates `docs/specsmd/` and copies the shipped `default` recipe.

## Close

State what now exists. Offer — without requiring — `intent-create`.
