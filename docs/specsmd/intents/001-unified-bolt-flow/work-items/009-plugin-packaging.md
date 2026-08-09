---
id: 009-plugin-packaging
title: The flow installs as the specsmd plugin and coexists with everything
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [000-flow-evals, 005-planning-skills, 006-execution-skills, 007-navigator-status, 008-standards-system]
created: 2026-08-09
---

# The flow installs as the specsmd plugin and coexists with everything

The unified flow reaches users as the **specsmd** plugin — the default install, the AI-DLC v2 implementation. Installing it yields a working flow in one step; nothing about it disturbs legacy users.

## Behavior

- Installing the plugin through a supported channel (plugin marketplace or the skills bootstrapper) yields a flow where: the navigator responds, shaping and execution skills are invocable by name, and the artifact root is created on first use.
- The plugin conforms to the same format rules the existing plugin validation enforces (skill frontmatter, plugin manifest, per-tool overlays); trigger evals from the evals work item pass against its shipped descriptions.
- The model-invocable surface is minimal: the navigator and the bootstrap announce themselves; every other skill activates by name only.
- Legacy plugins continue to install and pass their validation unchanged; a project using a legacy flow is never auto-migrated or warned by the new plugin.
- Whether the plugin is self-contained or depends on shared core infrastructure is decided during this work item and recorded as a decision entry with rationale and the rejected alternative.

## Definition of Done

- [ ] (gating) A fresh install via each supported channel produces a responding navigator and by-name skill activation.
- [ ] (gating) The plugin passes the repository's plugin-format validation.
- [ ] (gating) Trigger evals pass against the shipped skill descriptions.
- [ ] (gating) Legacy plugin validation results are identical before and after this work item.
- [ ] (gating) The core-relationship decision exists as a decision entry naming the rejected alternative.
