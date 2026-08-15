---
name: specsmd-init
description: Use when a project has no docs/specsmd tree yet, or the user wants to initialize the specsmd flow. Asks autonomy bias, detects workspace shape, and records constitution plus one engineering standard.
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
  intents/            # each intent holds brief.md, tasks.md, bolts/
  recipes/            # copy shipped recipe YAML from flow-runtime
  standards/          # only the files in standards.shipped
  decisions/index.md  # discovery index; files live on each bolt
  system/
```

`project.md` status is `active`.

Copy recipe files from `references/recipes/` in the `flow-runtime` skill as data.

Write **only** the ids in `standards.shipped` in `references/flow-contract.yaml` in the `flow-runtime` skill. Templates: `references/standards/{id}.md` in the `flow-runtime` skill for constitution and engineering; `references/nlspec.md` in the `flow-runtime` skill for nlspec (copy as-is — it is the flow writing standard, not inferred project law). Do not invent additional standard files.

### Lasting test

A rule belongs in constitution or engineering only if it will still be true after the current bolt and after the next five. Reject: this-bolt schema, table columns, agent operating procedure (AGENTS, charters, how to invoke skills), and implementation file names. Those go in a bolt decision, the spec, or AGENTS — not in `standards/`.

In an existing codebase, infer constitution + engineering as invariants, show them, and confirm before writing. That confirmation is not a second required question. If nothing lasting can be inferred, write the seed rules from the templates and say so.

If `docs/specsmd/standards/` already has files, leave them. Do not replace or delete them.

Do not require a script. Write the files.

## Close

State what now exists. Offer — without requiring — `plan-intent`.

Declinable next (none required):
- `plan-intent` — capture an outcome
- `specsmd-status` — read the tree
