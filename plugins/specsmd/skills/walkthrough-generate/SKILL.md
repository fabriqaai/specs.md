---
name: walkthrough-generate
description: Use when a bolt is ready to complete and needs a human-facing walkthrough. Writes what changed, why, deviations, and how to verify — with no source code.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Walkthrough

Every completed bolt yields a walkthrough, even when the recipe has no walkthrough stage.

Write `docs/specsmd/bolts/{boltId}/walkthrough.md` using `references/walkthrough.md` in the `bolt-execute` skill.

Required sections: what changed, why, deviations from plan, how to verify. The deviations heading (`## Deviations from plan`) always exists. If there are no deviations, it says `none`. Completion is refused without that heading.

Contains no source listings, patches, or fences (language-tagged, untagged, or `~~~`). Allowed: user-facing names, behavior, and verification invocations (plain text).

## Close

List the walkthrough. Offer at most three declinable next names. None is required. Do not invoke them. Completing the bolt is a script, not a required next skill.

Now exists:
- `docs/specsmd/bolts/{boltId}/walkthrough.md`

Declinable next (none required):
- `bolt-execute` — complete the bolt via `scripts/complete-bolt.cjs` in the `flow-runtime` skill
- `specsmd-status` — re-orient
- `bolt-start` — start another grouping
