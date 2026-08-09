---
id: 003-state-scripts
title: State scripts — the only frontmatter writers
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# State scripts — the only frontmatter writers

Port FIRE's script discipline onto frontmatter state: `init-bolt.cjs`, `update-stage.cjs`, `update-checkpoint.cjs`, `complete-bolt.cjs`. Scripts mutate artifact frontmatter; nothing else does.

## Acceptance criteria

- `init-bolt.cjs`: mints bolt ID (collision-safe), creates `bolts/{id}/bolt.md` with recipe, work_items, autonomy; supports batching multiple work items. Hard gate: the only way to create a bolt.
- `update-stage.cjs` / `update-checkpoint.cjs`: advance `current_stage`/`stages_completed`/`checkpoint_state` in bolt.md frontmatter; checkpoint synonym normalization carried over from FIRE.
- `complete-bolt.cjs`: refuses completion unless the recipe's final stage is reached and required artifacts exist (test report); `--force` override; cascades status bolt → work items → intent brief (fixes v1's `bolt-complete.cjs` argv bug by design).
- Resume point derives from bolt.md frontmatter, never from which artifact files happen to exist.
- No `npm install` into user projects (v1 FIRE footgun) — bundle or vendor the YAML dependency.
- Unit tests for every script in the existing Vitest suite.
