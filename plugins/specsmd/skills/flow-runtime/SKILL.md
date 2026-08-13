---
name: flow-runtime
description: Use when you need the specsmd flow contract, recipes, transitions, or templates. Skills write artifact state; this skill is the reference, not a required script runner.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: runtime
disable-model-invocation: true
---

# Flow runtime

Reference skill for the **specsmd flow**. The memory bank is `docs/specsmd/`.

Skills write artifact bodies **and** frontmatter. Follow `references/flow-contract.yaml` and `references/transitions.md`. Do not invent status tokens. Do not require a Node script to change state.

## Read first

| File | What it settles |
|---|---|
| `references/flow-contract.yaml` | paths, status values, ceremony matrix, recipes list |
| `references/transitions.md` | who may move which status, cascade, dynamic grouping |
| `references/recipes/*.yaml` | stage catalogs (`default`, `ddd`, `spike`, `simple`) |
| `references/nlspec.md` | how to write intents and work items |
| `references/standards/` | shipped standard templates |

A bolt stores `recipe` plus `recipe_snapshot` at start. The snapshot does not change.

There are no state scripts. Write the files.

## Close

This skill is a library. Do not invoke it as a next step. Other skills name it as the place to read the contract.
