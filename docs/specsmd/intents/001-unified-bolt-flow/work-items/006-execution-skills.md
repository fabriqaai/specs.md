---
id: 006-execution-skills
title: Execution skills — bolt-start, code-review, walkthrough
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [002-recipe-catalog, 003-state-scripts]
created: 2026-08-09
---

# Execution skills

The core loop. `bolt-start`: offer scope (single item / batch / adopt draft), pick recipe, run stages under the ceremony dial, resume from frontmatter if interrupted. Plus FIRE's `code-review` (project linter, AUTO-FIX vs CONFIRM classification, revert-on-test-failure) and `walkthrough` (human-facing narrative, no code, deviations-from-plan).

## Acceptance criteria

- `bolt-start` reads the recipe file for its stage sequence — bolt-type/recipe agnostic, exactly like v1's construction agent was.
- Ceremony dial applied per stage: autopilot / confirm / validate from complexity × autonomy bias; gates are checkpoint_state in frontmatter, machine-readable.
- Resume table: interrupted bolts continue from `current_stage`, derived from bolt.md frontmatter only.
- Test artifacts required before completion (enforced by `complete-bolt.cjs`, not by skill prose).
- ADRs from ddd-recipe bolts land in `decisions/` with "Read when" index entries.
