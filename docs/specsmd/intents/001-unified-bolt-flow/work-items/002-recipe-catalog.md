---
id: 002-recipe-catalog
title: Recipe format and the four core recipes
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# Recipe format and the four core recipes

Recipes are stage catalogs as **data files** in `docs/specsmd/recipes/` — never hardcoded in scripts or skills. Each recipe declares its ordered stages, the artifacts each stage produces, and which stages are gateable.

## Acceptance criteria

- Recipe file format defined (YAML or frontmatter-md) with: stages[], per-stage artifact list, gateable flag, and constraints (e.g. ddd's "no source code in stages 1–2", spike's mandatory `time_box`).
- Four recipes shipped: `default` (plan → execute → test → review), `ddd` (domain-model → design → adr → implement → test), `spike` (explore → findings), `simple` (plan → implement → walkthrough).
- Users can add project-local recipes by dropping a file in `recipes/` — no code change.
- `bolt-start` selects a recipe at creation time from complexity signals or user choice; recipe recorded in bolt frontmatter.
