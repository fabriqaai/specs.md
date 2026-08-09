---
id: 010-v2-docs
title: v2 documentation under /v2 on the site
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [009-plugin-packaging]
created: 2026-08-09
---

# v2 documentation under /v2

Document the unified flow on the website under the `/v2` path, deployed from `main-v2`. Legacy documentation keeps every existing URL (SEO) — the site carries both doc sets, with a version switcher between them.

## Acceptance criteria

- `/v2` section: quickstart (install → intent → bolt), concepts (bolt, recipe, ceremony dial, lenses), recipe reference, skills reference, "coming from v1 aidlc/fire" terminology mapping.
- Zero changes to existing legacy doc URLs; version switch visible on both.
- Deployment from `main-v2` verified against the existing docs pipeline.
- No competitor tool names anywhere (OSS policy).
