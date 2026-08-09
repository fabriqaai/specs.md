---
id: 008-standards-system
title: Standards system — constitution, hierarchy, project-init
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# Standards system

FIRE's model carried over: `standards/` with `constitution.md` (never overridable), tech-stack, coding/testing standards, system-architecture; hierarchical monorepo overrides (nearest-ancestor resolution, longest-matching-scope wins). `project-init` does greenfield/brownfield + monorepo detection and asks for autonomy bias — the flow's one setup question.

## Acceptance criteria

- Constitution exempt from module override; resolution rules documented and tested.
- `project-init` creates the `docs/specsmd/` tree, generates standards from templates, records workspace facts + autonomy bias (in a config artifact's frontmatter, not a state file).
- Brownfield: standards inferred from existing code where possible, confirmed with the user.
