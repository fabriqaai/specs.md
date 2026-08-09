---
id: 001-flow-schema
title: Flow config, frontmatter contracts, and ID conventions
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: []
created: 2026-08-09
---

# Flow config, frontmatter contracts, and ID conventions

Define the machine-readable contract everything else builds on: the flow's `memory-bank.yaml`-equivalent config (artifact root `docs/specsmd/`, paths, naming), and the frontmatter schema for every artifact type — intent brief (`id`, `title`, `status`), work item (`id`, `title`, `intent`, `complexity`, `status`, `depends_on`), bolt (`id`, `title`, `status`, `recipe`, `work_items`, `current_stage`, `stages_completed`, `checkpoint_state`, `autonomy`).

## Acceptance criteria

- One config file the installer, dashboard, and VS Code extension can parse (study Phase 1: no more hardcoded flow lists).
- Frontmatter schemas documented with allowed enum values — one status vocabulary, no v1 drift (v1 had three conflicting status enums).
- ID conventions: intents `NNN-slug`, work items `NNN-slug`, bolts `bolt-NNN` (collision-safe for parallel worktrees, per FIRE's max(disk, config)+1 rule).
- Explicitly documented: there is no central state file; frontmatter is the source of truth; scripts are the only writers.
