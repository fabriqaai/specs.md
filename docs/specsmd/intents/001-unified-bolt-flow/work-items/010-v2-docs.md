---
id: 010-v2-docs
title: v2 documentation lives under /v2 without disturbing v1
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [009-plugin-packaging]
created: 2026-08-09
---

# v2 documentation lives under /v2 without disturbing v1

The unified flow is documented on the site under the `/v2` path. Legacy documentation keeps every existing URL. One site carries both, with a visible way to switch.

## Behavior

- The `/v2` section covers: a quickstart (install → first intent → first bolt), the concepts (bolt, recipe, ceremony dial, lenses, nlspec, memory model), a recipe reference, a skills reference, the nlspec writing standard, the manual install path for tools without a plugin marketplace, and a "coming from v1" terminology mapping for both legacy flows *(orientation only — v2 provides no migration tooling, and the docs say so plainly)*.
- Every documentation URL that resolved before this work resolves to the same content after it.
- A version switcher is visible from both documentation sets.
- The site deploys from the v2 branch and carries both documentation sets.
- No competitor tool is named anywhere in the documentation.

## Definition of Done

- [ ] (gating) Every pre-existing documentation URL returns its prior content.
- [ ] (gating) The `/v2` quickstart, followed verbatim in a fresh project, reaches a completed first bolt.
- [ ] (gating) The version switcher is reachable from the legacy docs home and the /v2 home.
- [ ] (gating) A search of the documentation source for known competitor names returns nothing.
- [ ] (advisory) The terminology mapping covers every renamed concept from both legacy flows.
