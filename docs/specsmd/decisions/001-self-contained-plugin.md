---
id: 001-self-contained-plugin
status: active
created: 2026-08-13
consult_when: plugin packaging, core vs unified install, whether specsmd depends on specsmd-core
---

# The unified flow ships as a self-contained `specsmd` plugin

## Decision

The unified bolt flow is the `specsmd` plugin. One install yields bootstrap, navigator, shaping skills, execution skills, and state scripts. It does not depend on `specsmd-core`.

## Rejected alternative

A shared `specsmd-core` plus a thin unified profile. Rejected because the default install must be complete, and core+profile recreates the two-plugin tax the unification was meant to end.

## Consequence

Legacy `specsmd-core` remains for v1 flows. The two `using-specsmd` / `specsmd-status` copies are allowed to coexist; a project should install one or the other, not both.
