---
id: 009-plugin-packaging
title: Package as the `specsmd` plugin
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [005-planning-skills, 006-execution-skills, 007-navigator-status, 008-standards-system]
created: 2026-08-09
---

# Package as the `specsmd` plugin

Ship the unified flow as `plugins/specsmd/` — the default install, branded AI-DLC v2. Decide and implement the `specsmd-core` relationship: absorb the bootstrap/SessionStart hook into this plugin (one install, batteries included) or depend on core as shared infrastructure for companion flows.

## Acceptance criteria

- `plugins/specsmd/` passes the existing plugin-validation suite (Agent Skills six-field frontmatter, Agent Plugins spec, Codex overlays for verb skills).
- Marketplace entry added; install works via `/plugin install specsmd@specsmd` and `npx specsmd skills` bootstrapper.
- Model-invocable description budget: navigator + bootstrap only; every verb skill `disable-model-invocation: true`.
- Legacy plugins (`specsmd-aidlc`, `specsmd-fire`) untouched and still passing validation.
- specsmd-core decision documented as an ADR in `docs/specsmd/decisions/`.
